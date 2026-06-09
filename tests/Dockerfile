# QA test runner — executes the API/contract/security-regression suites against the live stack.
FROM python:3.12-slim@sha256:866411c135b507754efdf2fda51484be4d3d7d5173ed53cd083106132e710904
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /tests
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Default: run API + integration suites; UI (Playwright) and perf (k6) are separate stages.
CMD ["pytest", "-q", "api", "integration"]
