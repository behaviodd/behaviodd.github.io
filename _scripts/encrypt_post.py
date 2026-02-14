#!/usr/bin/env python3
"""Encrypt a Jekyll post's body with AES-256-GCM.

Usage:
    python3 _scripts/encrypt_post.py _posts/2026-02-14-secret-test.md

The post must have `secret: true` in its front matter.
Password can be specified in front matter as `password: yourpass`
(it will be removed after encryption), or you will be prompted.

The script overwrites the file with the front matter intact and
the body replaced by a single base64-encoded blob:
    base64(salt[16] || iv[12] || ciphertext || tag[16])

The browser-side Web Crypto API (PBKDF2 + AES-GCM) can decrypt it.
"""

import base64
import getpass
import os
import re
import sys

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes


ITERATIONS = 100_000
SALT_LEN = 16
IV_LEN = 12


def parse_front_matter(text: str):
    """Return (front_matter_str_with_delimiters, body_str)."""
    if not text.startswith("---"):
        raise ValueError("File does not start with front matter (---)")
    end = text.index("---", 3)
    end += 3
    # skip the newline right after closing ---
    if end < len(text) and text[end] == "\n":
        end += 1
    return text[:end], text[end:]


def extract_password(front_matter: str):
    """Extract and remove password field from front matter."""
    match = re.search(r'^password:\s*(.+)$', front_matter, re.MULTILINE)
    if not match:
        return front_matter, None
    password = match.group(1).strip().strip('"').strip("'")
    cleaned = re.sub(r'^password:\s*.+\n?', '', front_matter, flags=re.MULTILINE)
    return cleaned, password


def derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=ITERATIONS,
    )
    return kdf.derive(password.encode("utf-8"))


def encrypt(plaintext: str, password: str) -> str:
    salt = os.urandom(SALT_LEN)
    iv = os.urandom(IV_LEN)
    key = derive_key(password, salt)
    aesgcm = AESGCM(key)
    ciphertext_and_tag = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)
    blob = salt + iv + ciphertext_and_tag
    return base64.b64encode(blob).decode("ascii")


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <post.md>")
        sys.exit(1)

    path = sys.argv[1]
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    front_matter, body = parse_front_matter(text)

    if "secret: true" not in front_matter:
        print("Error: post does not have `secret: true` in front matter.")
        sys.exit(1)

    if not body.strip():
        print("Error: post body is empty.")
        sys.exit(1)

    front_matter, password = extract_password(front_matter)

    if password:
        print(f"Using password from front matter.")
    else:
        password = getpass.getpass("Password: ")
        if not password:
            print("Error: password cannot be empty.")
            sys.exit(1)
        confirm = getpass.getpass("Confirm password: ")
        if password != confirm:
            print("Error: passwords do not match.")
            sys.exit(1)

    encrypted = encrypt(body, password)

    with open(path, "w", encoding="utf-8") as f:
        f.write(front_matter)
        f.write(encrypted)
        f.write("\n")

    print(f"Encrypted: {path}")


if __name__ == "__main__":
    main()
