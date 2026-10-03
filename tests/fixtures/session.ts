export const fixtureUsers = {
  a: {id:'11111111-1111-4111-8111-111111111111',email:'a@example.test'},
  b: {id:'22222222-2222-4222-8222-222222222222',email:'b@example.test'},
  c: {id:'33333333-3333-4333-8333-333333333333',email:'c@example.test'},
};
export function fixtureCookie(key: keyof typeof fixtureUsers) {
  const user=fixtureUsers[key]; const exp=Math.floor(Date.now()/1000)+3600;
  const jwt=[{alg:'none',typ:'JWT'},{sub:user.id,exp,role:'authenticated',fixture:key}].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.')+'.fixture';
  const session={access_token:jwt,refresh_token:`fixture-${key}`,expires_at:exp,expires_in:3600,token_type:'bearer',user};
  return {name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url')};
}
