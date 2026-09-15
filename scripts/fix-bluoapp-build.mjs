import fs from 'node:fs';

const path = 'components/BluoApp.tsx';
const source = fs.readFileSync(path, 'utf8');
const broken = 'permission can be enabled here.</div>}</div></div></>; }';
const fixed = 'permission can be enabled here.</div></>}</div></div></>; }';

if (source.includes(broken)) {
  fs.writeFileSync(path, source.replace(broken, fixed));
  console.log('Fixed BluoApp.tsx notification JSX before build.');
} else {
  console.log('BluoApp.tsx notification JSX already fixed.');
}
