const fetch = require('node-fetch');

const PROJECT_URL = 'https://<PROJECT_REF>.supabase.co';
const SERVICE_ROLE_KEY = '<SERVICE_ROLE_KEY>';
const DB_URL = 'postgresql://postgres:[SERVICE_ROLE_KEY]@db.<PROJECT_REF>.supabase.co:5432/postgres'; // Or use the connection string from Supabase dashboard

const users = [
  { email: 'driver1@example.com', password: 'Driver@1234', role: 'driver' },
  { email: 'supervisor1@example.com', password: 'Supervisor@1234', role: 'supervisor' },
  { email: 'admin1@example.com', password: 'Admin@1234', role: 'admin' }
];

async function createUser(email, password) {
  const response = await fetch(`${PROJECT_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create user ${email}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.id;
}

async function insertAdminUser(id, email, role) {
  const { Client } = require('pg');
  const client = new Client({
    connectionString: DB_URL
  });

  await client.connect();

  const query = `
    INSERT INTO public.admin_users (id, email, role)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO NOTHING;
  `;

  await client.query(query, [id, email, role]);
  await client.end();
}

async function main() {
  for (const user of users) {
    try {
      console.log(`Creating user: ${user.email}`);
      const id = await createUser(user.email, user.password);
      console.log(`User created with ID: ${id}`);

      console.log(`Inserting into admin_users: ${user.email}`);
      await insertAdminUser(id, user.email, user.role);
      console.log(`Inserted successfully`);
    } catch (error) {
      console.error(`Error for ${user.email}:`, error.message);
    }
  }

  console.log('All done!');
}

main().catch(console.error);
