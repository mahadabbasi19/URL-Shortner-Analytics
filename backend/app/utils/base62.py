import secrets

_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def generate_short_code(length: int) -> str:
    """Generate a random URL-safe Base62 code using a CSPRNG.

    WHY secrets over random: `random` is a Mersenne Twister — predictable
    once enough output is observed, which would let an attacker guess or
    enumerate other users' short links. `secrets` is built for exactly this.

    Namespace: 62^7 ≈ 3.5 trillion combinations at the default length, so
    collisions are rare but NOT impossible — callers must still retry on a
    unique-constraint violation (see services/shortener_service.py).
    """
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))
