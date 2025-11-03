CREATE TABLE sales_agents (
id UUID PRIMARY KEY,
name TEXT NOT NULL,
email TEXT UNIQUE NOT NULL,
phone TEXT,
org_name TEXT,
style_preset TEXT DEFAULT 'colloquial',
salesflow_json JSONB NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE clients (
id UUID PRIMARY KEY,
agent_id UUID REFERENCES sales_agents(id) ON DELETE CASCADE,
full_name TEXT,
phone TEXT,
email TEXT,
instagram_handle TEXT,
facebook_username TEXT,
whatsapp_id TEXT,
source_channel TEXT,
lead_score INT DEFAULT 0,
stage TEXT DEFAULT 'new',
meta JSONB,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE conversations (
id UUID PRIMARY KEY,
client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
agent_id UUID REFERENCES sales_agents(id) ON DELETE CASCADE,
channel TEXT NOT NULL,
external_thread_id TEXT,
last_message_at TIMESTAMPTZ,
state TEXT DEFAULT 'greeting',
context JSONB,
created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE messages (
id UUID PRIMARY KEY,
conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
direction TEXT NOT NULL,
sender TEXT,
text TEXT,
media_urls TEXT[],
payload JSONB,
created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE vehicles (
id UUID PRIMARY KEY,
agent_id UUID REFERENCES sales_agents(id) ON DELETE CASCADE,
brand TEXT NOT NULL,
model TEXT NOT NULL,
year INT NOT NULL,
color TEXT,
price NUMERIC(12,2),
stock INT DEFAULT 1,
features TEXT[],
photos JSONB,
metadata JSONB,
created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE documents (
id UUID PRIMARY KEY,
client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
agent_id UUID REFERENCES sales_agents(id) ON DELETE CASCADE,
type TEXT,
storage_backend TEXT,
storage_path TEXT,
original_name TEXT,
size_bytes BIGINT,
created_at TIMESTAMPTZ DEFAULT NOW()
);