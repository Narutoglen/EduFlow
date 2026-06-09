"""SSRF egress-guard tests (Security blocking item, A01:2025). No network required (IP literals)."""
import pytest

from app.services.ai.net.ssrf import SsrfBlocked, validate_url


@pytest.mark.parametrize(
    "url",
    [
        "http://169.254.169.254/latest/meta-data/",  # cloud metadata
        "http://127.0.0.1/",                          # loopback v4
        "http://[::1]/",                              # loopback v6
        "http://10.0.0.5/",                           # private A
        "http://192.168.1.10/",                       # private C
        "http://172.16.5.4/",                         # private B
        "http://0.0.0.0/",                            # unspecified
        "ftp://example.com/file",                     # bad scheme
        "file:///etc/passwd",                         # bad scheme
        "http:///nohost",                             # missing host
    ],
)
def test_blocks_dangerous_urls(url):
    with pytest.raises(SsrfBlocked):
        validate_url(url)


def test_allows_public_ip_literal():
    # 8.8.8.8 is a public address; literal IP needs no DNS, so this is offline-deterministic.
    assert validate_url("https://8.8.8.8/") == "8.8.8.8"
