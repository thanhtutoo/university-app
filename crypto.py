from urllib.parse import quote, unquote
import base64
import subprocess

# This is just a python wrapper around standard open source CLI tools.
# It is perfectly fine to skip python altogether and use said tools directly instead. The exact
# commands are documented in aes_encrypt/aes_decrypt functions.

# The equivalent CLI commands provided here assume the GNU Coreutils version of `base64`.
# We know at least that the `base64` provided on OS X by Homebrew isn't compatible (doesn't
# support --wrap argument).

# Requirements:
#   python 3.6 or newer
#   GnuPG

# Tested on:
#   python 3.6
#   gpg (GnuPG) 2.0.28
#   libgcrypt 1.5.3

def main():
    '''
    Usage:
        python3 crypto.py <action> <passphrase> <plaintext_input>

    Example:
        $ python3 crypto.py eencrypt pass foobar
        jA0ECQMC2Hubgij6S7H%2F0jsBVaBr1lwEZbngzPsCGr2vrndNQO4b4L0LMrgwKfkKsoTjn%2FAuECjxVyCML3hMM%2BFs54QBd8xXg3qZCw%3D%3D

        $ python3 crypto.py edecrypt pass 'jA0ECQMC2Hubgij6S7H%2F0jsBVaBr1lwEZbngzPsCGr2vrndNQO4b4L0LMrgwKfkKsoTjn%2FAuECjxVyCML3hMM%2BFs54QBd8xXg3qZCw%3D%3D'
        foobar

    The `e` prefix before encrypt/decrypt action means the output will be percent-encoded so it can
    be used as a URL param in an HTTP GET request. Skip this prefix if you are already escaping GET
    query params somewhere else in your pipeline.
    '''

    from sys import argv
    _, action, passphrase, input_string = argv

    if action == 'encrypt':
        print(aes_encrypt(input_string, passphrase))

    elif action == 'eencrypt':
        print(quote(aes_encrypt(input_string, passphrase), safe=''))

    elif action == 'decrypt':
        print(aes_decrypt(input_string, passphrase))

    elif action == 'edecrypt':
        print(aes_decrypt(unquote(input_string), passphrase))

    else:
        print('Invalid action. See main() function in source code.')


def aes_encrypt(plaintext, passphrase):
    '''
    Reference encryption implementation.
    Equivalent to:
      $ printf 'plaintext' | gpg --batch --symmetric --cipher-algo AES256 --passphrase 'passphrase' | base64 --wrap=0
    '''
    assert plaintext != ''

    result = subprocess.run(
        f"gpg --no-options --batch --symmetric --cipher-algo AES256 --passphrase '{passphrase}'",
        shell=True,
        input=plaintext.encode(),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    if not result.stdout:
        print('>>>>>>>>>>>>>> stderr:')
        print(result.stderr.decode())
        print('<<<<<<<<<<<<<< end stderr')
        raise EncryptionFailedException("Encryption failed.")

    base64_ciphertext = base64.b64encode(result.stdout).decode()

    return base64_ciphertext


def aes_decrypt(ciphertext, passphrase):
    '''
    Equivalent to:
      $ printf "<b64 ciphertext>"\
              | base64 -d\
              | gpg --no-options --batch --cipher-algo AES256 --passphrase 'passphrase' --decrypt
    '''

    try:
        ciphertext_bytes = base64.b64decode(ciphertext)
    except Exception:
        raise DecryptionFailedException("Input isn't a base64 encoded string.")

    result = subprocess.run(
        f"gpg --no-options --batch --cipher-algo AES256 --passphrase '{passphrase}' --decrypt",
        shell=True,
        input=ciphertext_bytes,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    if not result.stdout:
        print('>>>>>>>>>>>>>> stderr:')
        print(result.stderr.decode())
        print('<<<<<<<<<<<<<< end stderr')
        raise DecryptionFailedException("Decryption failed.")

    return result.stdout.decode()


class DecryptionFailedException(Exception):
    pass

class EncryptionFailedException(Exception):
    pass


if __name__ == "__main__":
    main()
