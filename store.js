const fs=require('node:fs'),path=require('node:path');
const seed=[
{id:1,name:'Fustan elegant midi',category:'Fustane',price:1890,old:2290,badge:'Më i shituri',image:'photo-1539008835657-9e8e9680c956'},
{id:2,name:'Fustan glamur krem',category:'Fustane',price:2490,badge:'I ri',image:'photo-1595777457583-95e059d581b8'},
{id:3,name:'Fustan sateni bordo',category:'Fustane',price:1290,image:'photo-1551163943-3f6a855d1153'},
{id:4,name:'Fustan modest krem',category:'Sete',price:2190,badge:'I ri',image:'photo-1483985988355-763728e1935b'},
{id:5,name:'Fustan klasik bezhë',category:'Fustane',price:990,image:'photo-1566206091558-7f218b696731'},
{id:6,name:'Fustan mbrëmjeje i zi',category:'Fustane',price:1990,image:'photo-1566174053879-31528523f8ae'},
{id:7,name:'Set elegant dy pjesësh',category:'Sete',price:1690,badge:'I preferuar',image:'photo-1506629905607-d9e6c7e8e773'},
{id:8,name:'Aksesorë elegantë',category:'Aksesorë',price:1490,image:'photo-1584917865442-de89df76afd3'}];
class JsonStore{
constructor(){this.file=path.join(__dirname,'data.json');try{this.db=JSON.parse(fs.readFileSync(this.file,'utf8'))}catch{this.db={users:[],sessions:[],orders:[],products:seed};this.save()}}
save(){const t=this.file+'.tmp';fs.writeFileSync(t,JSON.stringify(this.db,null,2));fs.renameSync(t,this.file)}
async init(){let changed=false;for(const o of this.db.orders){if(!o.currency){o.currency=o.shippingCurrency==='EUR'?'EUR':'MKD';if(o.currency==='EUR'){o.items=(o.items||[]).map(i=>{const unitPrice=Math.floor(i.unitPrice/61.5);return {...i,unitPriceMKD:i.unitPrice,unitPrice,currency:'EUR',lineTotal:unitPrice*i.qty}});o.subtotal=o.items.reduce((n,i)=>n+i.lineTotal,0);o.total=o.subtotal+o.shippingFee}else{for(const i of o.items||[]){i.unitPriceMKD=i.unitPrice;i.currency='MKD'}o.total=o.total??o.subtotal+o.shippingFee}changed=true}}if(changed)this.save()}
async findUser(email){return this.db.users.find(u=>u.email===email)||null}
async createUser(u){this.db.users.push(u);this.save()}
async updatePassword(id,salt,hash){const u=this.db.users.find(x=>x.id===id);if(!u)return false;u.salt=salt;u.hash=hash;this.db.sessions=this.db.sessions.filter(x=>x.userId!==id);this.save();return true}
async deleteUserSessions(id){this.db.sessions=this.db.sessions.filter(x=>x.userId!==id);this.save()}
async adminCount(){return this.db.users.filter(u=>u.role==='admin').length}
async session(hash){const s=this.db.sessions.find(x=>x.tokenHash===hash&&Date.parse(x.expires)>Date.now());return s?{user:this.db.users.find(u=>u.id===s.userId),expires:s.expires}:null}
async createSession(s){this.db.sessions=this.db.sessions.filter(x=>Date.parse(x.expires)>Date.now()&&x.tokenHash!==s.tokenHash);this.db.sessions.push(s);this.save()}
async deleteSession(hash){this.db.sessions=this.db.sessions.filter(s=>s.tokenHash!==hash);this.save()}
async products(){return this.db.products}
async createOrder(o){this.db.orders.unshift(o);this.save();return o}
async ordersForUser(id){return this.db.orders.filter(o=>o.userId===id)}
async allOrders(){return this.db.orders}
async updateStatus(id,status){const o=this.db.orders.find(x=>x.id===id);if(!o)return null;o.status=status;this.save();return o}
async addProduct(p){p.id=this.db.products.reduce((m,x)=>Math.max(m,x.id),0)+1;this.db.products.push(p);this.save();return p}
async deleteProduct(id){const n=this.db.products.length;this.db.products=this.db.products.filter(p=>p.id!==id);if(n===this.db.products.length)return false;this.save();return true}
async close(){}
}
class PgStore{
constructor(){const {Pool}=require('pg');this.pool=new Pool({connectionString:process.env.DATABASE_URL,max:10,connectionTimeoutMillis:10000,idleTimeoutMillis:30000,application_name:'bellastyle-store'})}
async init(){await this.pool.query("CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,salt TEXT NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('customer','admin')),created_at TIMESTAMPTZ NOT NULL DEFAULT now()); CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now()); CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at); CREATE TABLE IF NOT EXISTS products(id SERIAL PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,price INTEGER NOT NULL CHECK(price>0),old_price INTEGER,badge TEXT NOT NULL DEFAULT '',image TEXT NOT NULL); CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),email TEXT NOT NULL,customer JSONB NOT NULL,items JSONB NOT NULL,total NUMERIC(12,2) NOT NULL,subtotal NUMERIC(12,2) NOT NULL CHECK(subtotal>0),shipping_fee NUMERIC(12,2) NOT NULL,shipping_currency TEXT NOT NULL,currency TEXT NOT NULL DEFAULT 'MKD',payment TEXT NOT NULL,status TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now()); CREATE INDEX IF NOT EXISTS orders_user_date_idx ON orders(user_id,created_at DESC); ALTER TABLE orders ALTER COLUMN total TYPE NUMERIC(12,2) USING total::numeric; ALTER TABLE orders ALTER COLUMN subtotal TYPE NUMERIC(12,2) USING subtotal::numeric; ALTER TABLE orders ALTER COLUMN shipping_fee TYPE NUMERIC(12,2) USING shipping_fee::numeric; ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency TEXT; UPDATE orders SET currency=COALESCE(currency,shipping_currency,'MKD') WHERE currency IS NULL; UPDATE orders SET subtotal=FLOOR(subtotal/61.5),total=FLOOR(subtotal/61.5)+shipping_fee WHERE currency='EUR' AND total IS NULL; ALTER TABLE orders ALTER COLUMN total SET NOT NULL; ALTER TABLE orders ALTER COLUMN currency SET DEFAULT 'MKD'; ALTER TABLE orders ALTER COLUMN currency SET NOT NULL;");const r=await this.pool.query('SELECT count(*)::int AS n FROM products');if(!r.rows[0].n){for(const p of seed)await this.pool.query('INSERT INTO products(id,name,category,price,old_price,badge,image) VALUES($1,$2,$3,$4,$5,$6,$7)',[p.id,p.name,p.category,p.price,p.old||null,p.badge||'',p.image]);await this.pool.query("SELECT setval(pg_get_serial_sequence('products','id'),(SELECT max(id) FROM products))")}}
user(r){return r?{id:r.id,name:r.name,email:r.email,salt:r.salt,hash:r.password_hash,role:r.role,createdAt:r.created_at}:null}
order(r){return r?{id:r.id,userId:r.user_id,email:r.email,customer:r.customer,items:r.items,total:Number(r.total),subtotal:Number(r.subtotal),shippingFee:Number(r.shipping_fee),shippingCurrency:r.shipping_currency,currency:r.currency||r.shipping_currency,payment:r.payment,status:r.status,createdAt:r.created_at}:null}
product(r){return r?{id:r.id,name:r.name,category:r.category,price:r.price,old:r.old_price||undefined,badge:r.badge||'',image:r.image}:null}
async findUser(email){const r=await this.pool.query('SELECT * FROM users WHERE email=$1',[email]);return this.user(r.rows[0])}
async createUser(u){await this.pool.query('INSERT INTO users(id,name,email,salt,password_hash,role,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[u.id,u.name,u.email,u.salt,u.hash,u.role,u.createdAt])}
async updatePassword(id,salt,hash){const r=await this.pool.query('UPDATE users SET salt=$2,password_hash=$3 WHERE id=$1',[id,salt,hash]);await this.deleteUserSessions(id);return r.rowCount>0}
async deleteUserSessions(id){await this.pool.query('DELETE FROM sessions WHERE user_id=$1',[id])}
async adminCount(){const r=await this.pool.query("SELECT count(*)::int AS n FROM users WHERE role='admin'");return r.rows[0].n}
async session(hash){const r=await this.pool.query('SELECT s.expires_at,u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[hash]);return r.rows[0]?{user:this.user(r.rows[0]),expires:r.rows[0].expires_at.toISOString()}:null}
async createSession(s){await this.pool.query('DELETE FROM sessions WHERE expires_at<now() OR token_hash=$1',[s.tokenHash]);await this.pool.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)',[s.tokenHash,s.userId,s.expires])}
async deleteSession(hash){await this.pool.query('DELETE FROM sessions WHERE token_hash=$1',[hash])}
async products(){const r=await this.pool.query('SELECT * FROM products ORDER BY id');return r.rows.map(x=>this.product(x))}
async createOrder(o){const r=await this.pool.query('INSERT INTO orders(id,user_id,email,customer,items,total,subtotal,shipping_fee,shipping_currency,currency,payment,status,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',[o.id,o.userId,o.email,JSON.stringify(o.customer),JSON.stringify(o.items),o.total,o.subtotal,o.shippingFee,o.shippingCurrency,o.currency,o.payment,o.status,o.createdAt]);return this.order(r.rows[0])}
async ordersForUser(id){const r=await this.pool.query('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',[id]);return r.rows.map(x=>this.order(x))}
async allOrders(){const r=await this.pool.query('SELECT * FROM orders ORDER BY created_at DESC');return r.rows.map(x=>this.order(x))}
async updateStatus(id,status){const r=await this.pool.query('UPDATE orders SET status=$2 WHERE id=$1 RETURNING *',[id,status]);return this.order(r.rows[0])}
async addProduct(p){const r=await this.pool.query('INSERT INTO products(name,category,price,old_price,badge,image) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[p.name,p.category,p.price,p.old||null,p.badge,p.image]);return this.product(r.rows[0])}
async deleteProduct(id){const r=await this.pool.query('DELETE FROM products WHERE id=$1',[id]);return r.rowCount>0}
async close(){await this.pool.end()}
}
function createStore(){if(process.env.DATABASE_URL)return new PgStore();if(process.env.NODE_ENV==='production')throw Error('DATABASE_URL kërkohet në production.');return new JsonStore()}
module.exports={createStore};
