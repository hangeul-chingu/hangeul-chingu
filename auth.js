const KEY='fake_loggedout';
const user={uid:'qa-learner',email:'qa-learner@example.test',emailVerified:true,displayName:'학습자QA',reload:async()=>{},getIdToken:async()=>'fake',providerData:[]};
const subs=new Set();
export const auth={get currentUser(){return localStorage.getItem(KEY)?null:user}};
export function getAuth(){return auth}
export function onAuthStateChanged(a,cb){subs.add(cb);setTimeout(()=>cb(auth.currentUser),0);return()=>subs.delete(cb)}
export async function signInWithEmailAndPassword(){localStorage.removeItem(KEY);subs.forEach(c=>c(user));return{user}}
export async function createUserWithEmailAndPassword(){localStorage.removeItem(KEY);subs.forEach(c=>c(user));return{user}}
export async function signOut(){localStorage.setItem(KEY,'1');subs.forEach(c=>c(null))}
export async function updateProfile(){}
export async function sendEmailVerification(){}
export async function sendPasswordResetEmail(){}
