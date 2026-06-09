"""Voice + RAG assistant API (contract §4). Course-scoped; object-level authz (anti-IDOR)."""
from __future__ import annotations

import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app import crud, models
from app.core.config import Settings, get_settings
from app.core.security import Principal, get_principal
from app.db.session import get_db
from app.schemas import (
    AskServiceIn,
    AskOut,
    Citation,
    ConversationListOut,
    ConversationOut,
    MessageListOut,
    MessageOut,
)
from app.serializers import job_out
from app.services.ai.pipelines import rag
from app.worker import celery_app

router = APIRouter(prefix="/ai", tags=["assistant"])


@router.post("/assistant/voice", response_model=None, status_code=status.HTTP_202_ACCEPTED)
async def upload_voice(
    audio: UploadFile = File(...),
    courseId: str = Form(...),
    conversationId: str | None = Form(default=None),
    principal: Principal = Depends(get_principal),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    if not principal.can_read_course(courseId):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed to read this course")
    # Validate MIME (magic-byte check happens in the worker before decoding) — VA-2.
    if audio.content_type not in settings.allowed_audio_mime:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Unsupported audio type")

    data = await audio.read()
    if len(data) > settings.max_audio_mb * 1024 * 1024:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Audio too large")

    os.makedirs(settings.audio_dir, exist_ok=True)
    audio_key = f"{uuid.uuid4().hex}"
    path = os.path.join(settings.audio_dir, audio_key)
    with open(path, "wb") as fh:
        fh.write(data)

    tx = crud.create_transcription(
        db, user_id=principal.user_id, course_id=courseId, audio_key=audio_key,
        mime_type=audio.content_type,
    )
    job = crud.create_job(
        db, kind=models.JobKind.TRANSCRIBE, requested_by=principal.user_id,
        course_id=courseId, ref_id=str(tx.id), result_id=tx.id,
    )
    db.commit()
    celery_app.send_task("ai.transcribe", args=[str(job.id), str(tx.id), path, audio.content_type])
    return job_out(job)


@router.post("/assistant/ask", response_model=AskOut)
def ask(
    body: AskServiceIn,
    principal: Principal = Depends(get_principal),
    db: Session = Depends(get_db),
) -> AskOut:
    if not principal.can_read_course(body.courseId):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed to read this course")

    # Resolve or create the conversation; enforce ownership (anti-IDOR VA-1).
    if body.conversationId is not None:
        conv = crud.get_conversation(db, body.conversationId)
        if conv is None or (not principal.is_admin and conv.user_id != principal.user_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
        if conv.course_id != body.courseId:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Conversation belongs to another course")
    else:
        conv = crud.create_conversation(
            db, user_id=principal.user_id, course_id=body.courseId, title=body.question[:60]
        )

    source_audio_id = None
    if body.sourceAudioId is not None:
        tx = crud.get_transcription(db, body.sourceAudioId)
        if tx is not None and (principal.is_admin or tx.user_id == principal.user_id):
            source_audio_id = tx.id

    # RAG: retrieval is filtered by course_id (isolation invariant), then grounded generation.
    chunks = rag.retrieve(db, body.courseId, body.question)
    context, citations = rag.build_context(chunks, body.titles)
    answer_text = rag.answer(body.question, context)

    crud.add_message(
        db, conversation_id=conv.id, role=models.MessageRole.USER, content=body.question,
        source_audio_id=source_audio_id,
    )
    msg = crud.add_message(
        db, conversation_id=conv.id, role=models.MessageRole.ASSISTANT, content=answer_text,
        citations=citations,
    )
    db.commit()

    return AskOut(
        conversationId=conv.id,
        answer=answer_text,
        citations=[Citation(**c) for c in citations],
        messageId=msg.id,
    )


@router.get("/assistant/conversations", response_model=ConversationListOut)
def conversations(
    courseId: str = Query(...),
    limit: int = Query(default=20, ge=1, le=100),
    principal: Principal = Depends(get_principal),
    db: Session = Depends(get_db),
) -> ConversationListOut:
    rows = crud.list_conversations(db, principal.user_id, courseId, limit)
    return ConversationListOut(
        items=[ConversationOut(id=c.id, title=c.title, createdAt=c.created_at) for c in rows]
    )


@router.get("/assistant/conversations/{conv_id}/messages", response_model=MessageListOut)
def messages(
    conv_id: uuid.UUID,
    limit: int = Query(default=100, ge=1, le=200),
    principal: Principal = Depends(get_principal),
    db: Session = Depends(get_db),
) -> MessageListOut:
    conv = crud.get_conversation(db, conv_id)
    if conv is None or (not principal.is_admin and conv.user_id != principal.user_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    rows = crud.list_messages(db, conv_id, limit)
    return MessageListOut(
        items=[
            MessageOut(
                id=m.id, role=m.role.value, content=m.content,
                citations=[Citation(**c) for c in (m.citations or [])], createdAt=m.created_at,
            )
            for m in rows
        ]
    )
