import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
const kit=process.env.QA_KIT, work=process.env.QA_WORK
export default defineConfig({
  root:work, plugins:[react()],
  resolve:{alias:[
    {find:'firebase/auth',replacement:kit+'/fakes/auth.js'},
    {find:'firebase/firestore',replacement:kit+'/fakes/firestore.js'},
    {find:/^\.\/firebase$/,replacement:kit+'/fakes/firebase.js'},
  ]},
  server:{fs:{allow:[kit,work]}},
  build:{outDir:kit+'/dist',emptyOutDir:true},
  define:{'import.meta.env.VITE_FIREBASE_API_KEY':'"x"'}
})
