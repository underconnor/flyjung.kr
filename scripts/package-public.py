"""Package the verified public build without accepting files outside its manifest."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import os
import zipfile

root = Path(__file__).resolve().parent.parent
bundle = root / 'public-dist'
deploy = root / '.runtime' / 'deploy'
manifest = json.loads((deploy / 'public-manifest.json').read_text())
entries = manifest['files']
names = [entry['file'] for entry in entries]
if len(names) != len(set(names)):
    raise ValueError('Duplicate manifest entries')

actual = []
for item in bundle.rglob('*'):
    if item.is_symlink():
        raise ValueError(f'Symlink is not publishable: {item.relative_to(bundle)}')
    if item.is_file():
        actual.append(item.relative_to(bundle).as_posix())
if sorted(actual) != sorted(names):
    raise ValueError('Public directory and manifest disagree; rebuild before packaging')

contents = {}
for entry in entries:
    name = entry['file']
    relative = PurePosixPath(name)
    if relative.is_absolute() or '..' in relative.parts or '\\' in name:
        raise ValueError(f'Unsafe manifest path: {name}')
    if any(part.startswith('.') for part in relative.parts) or relative.suffix.lower() in {'.pdf', '.md', '.json', '.map', '.env'}:
        raise ValueError(f'Private/source file is not publishable: {name}')
    data = (bundle / name).read_bytes()
    if not data or len(data) != entry['bytes']:
        raise ValueError(f'Byte count mismatch: {name}')
    if hashlib.sha256(data).hexdigest() != entry['sha256']:
        raise ValueError(f'Hash mismatch: {name}')
    contents[name] = data
if sum(map(len, contents.values())) != manifest['totalBytes']:
    raise ValueError('Manifest total byte count mismatch')

archive = deploy / 'flyjung-public.zip'
staging = deploy / 'flyjung-public.zip.next'
try:
    with zipfile.ZipFile(staging, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as output:
        for name in sorted(contents):
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            output.writestr(info, contents[name])
    with zipfile.ZipFile(staging) as check:
        if check.testzip() is not None or sorted(check.namelist()) != sorted(names):
            raise ValueError('Archive integrity check failed')
        for name, original in contents.items():
            if check.read(name) != original:
                raise ValueError(f'Archive differs from public build: {name}')
    os.replace(staging, archive)
finally:
    staging.unlink(missing_ok=True)

report = {
    'archive': str(archive),
    'files': sorted(names),
    'fileCount': len(names),
    'uncompressedBytes': manifest['totalBytes'],
    'bytes': archive.stat().st_size,
    'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
}
(deploy / 'package-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: value for key, value in report.items() if key != 'files'}, ensure_ascii=False))
