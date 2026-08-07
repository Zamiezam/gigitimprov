import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgfrkltitkwywvkkojhh.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZnJrbHRpdGt3eXd2a2tvamhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTUyNDg3MiwiZXhwIjoyMTAxMTAwODcyfQ.bz3PY5G9rb4mbe5rfHvT0BAzzUFETZZpHFMQK9u7kMo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const IDS = [
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
];

async function main() {
  // Step 1: Nuke the broken rows using raw SQL via RPC
  console.log('🔥 Nuking broken rows via raw SQL...\n');
  
  const { error: rpcError } = await supabase.rpc('exec_sql', { query: `
    DELETE FROM public.hired_workers WHERE employer_id IN ('10000000-0000-0000-0000-000000000001') OR worker_id IN ('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001');
    DELETE FROM public.profiles WHERE id IN ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001');
    DELETE FROM auth.identities WHERE user_id IN ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001');
    DELETE FROM auth.users WHERE id IN ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001');
  `});
  
  if (rpcError) {
    console.log('  RPC not available, trying direct approach...');
    // The service role key bypasses RLS, so we can use the REST API to delete from public tables
    // But for auth tables we need a different approach
    
    // Clean public tables first
    for (const id of IDS) {
      await supabase.from('hired_workers').delete().eq('employer_id', id);
      await supabase.from('hired_workers').delete().eq('worker_id', id);
      await supabase.from('profiles').delete().eq('id', id);
    }
    console.log('  ✅ Public tables cleaned');
    
    // For auth tables, use the admin deleteUser which handles both auth.users and auth.identities
    for (const id of IDS) {
      const res = await supabase.auth.admin.deleteUser(id);
      console.log(`  Auth delete ${id}: ${res.error ? res.error.message : '✅'}`);
    }
  } else {
    console.log('  ✅ Raw SQL cleanup done');
  }

  // Also check for any users with these emails that might have different UUIDs
  console.log('\n🔍 Checking for email conflicts...');
  const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const testEmails = ['employer_esg@test.com', 'elite_worker@test.com', 'avg_worker@test.com'];
  
  for (const u of (allUsers?.users || [])) {
    if (testEmails.includes(u.email)) {
      console.log(`  Found existing ${u.email} with id ${u.id}, deleting...`);
      await supabase.from('hired_workers').delete().eq('employer_id', u.id);
      await supabase.from('hired_workers').delete().eq('worker_id', u.id);
      await supabase.from('profiles').delete().eq('id', u.id);
      await supabase.auth.admin.deleteUser(u.id);
    }
  }

  console.log('\n⏳ Waiting 3s for GoTrue to fully sync...');
  await new Promise(r => setTimeout(r, 3000));

  // Step 2: Create users properly
  console.log('\n🚀 Creating fresh test users...\n');

  const userDefs = [
    { email: 'employer_esg@test.com', name: 'EcoEvents Sabah', role: 'employer' },
    { email: 'elite_worker@test.com', name: 'Siti (Elite Student)', role: 'worker' },
    { email: 'avg_worker@test.com', name: 'Bakar (Average Student)', role: 'worker' },
  ];

  const ids = {};

  for (const u of userDefs) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: u.name, role: u.role }
    });

    if (error) {
      console.log(`  ❌ ${u.email}: ${error.message}`);
      continue;
    }

    const key = u.role === 'employer' ? 'employer' : u.email.includes('elite') ? 'elite' : 'avg';
    ids[key] = data.user.id;
    console.log(`  ✅ ${u.email} → ${data.user.id}`);
    await new Promise(r => setTimeout(r, 500));
  }

  if (!ids.employer || !ids.elite || !ids.avg) {
    console.error('\n❌ User creation failed. Aborting.');
    process.exit(1);
  }

  // Step 3: Update profiles
  console.log('\n📝 Updating profiles...\n');

  await supabase.from('profiles').update({
    full_name: 'EcoEvents Sabah', role: 'employer', is_verified: true,
    company_name: 'EcoEvents Sabah Enterprise', industry: 'Event Management',
    city: 'Kota Kinabalu', state: 'Sabah'
  }).eq('id', ids.employer);

  await supabase.from('profiles').update({
    full_name: 'Siti (Elite Student)', role: 'worker', is_verified: true,
    bio: 'Top Tier 4.9 Rated Student.', income_classification: 'B40',
    university: 'Universiti Malaysia Sabah', city: 'Likas, KK', state: 'Sabah'
  }).eq('id', ids.elite);

  await supabase.from('profiles').update({
    full_name: 'Bakar (Average Student)', role: 'worker', is_verified: true,
    bio: 'Trying my best to earn side income.', income_classification: 'M40',
    university: 'UiTM Sabah', city: 'Sepanggar, KK', state: 'Sabah'
  }).eq('id', ids.avg);

  console.log('  ✅ All profiles updated');

  // Step 4: Inject shift history
  console.log('\n📊 Injecting shift history...\n');

  const shifts = [
    { employer_id: ids.employer, worker_id: ids.elite, worker_name: 'Siti (Elite Student)', worker_avatar: 'https://randomuser.me/api/portraits/women/12.jpg', gig_title: 'Event Registration Crew', amount: 80, status: 'verified', payment_status: 'paid', rating_given: true, rating: 5, review: 'Absolutely fantastic! Arrived 15 minutes early.', sweat_metrics: { skills: 5, work_ethic: 5, trust: 5 }, clock_in_time: new Date(Date.now() - 3*86400000 - 4*3600000).toISOString(), clock_out_time: new Date(Date.now() - 3*86400000).toISOString() },
    { employer_id: ids.employer, worker_id: ids.elite, worker_name: 'Siti (Elite Student)', worker_avatar: 'https://randomuser.me/api/portraits/women/12.jpg', gig_title: 'Catering Assistant', amount: 60, status: 'completed', payment_status: 'paid', rating_given: true, rating: 5, review: 'Very proactive and required no supervision.', sweat_metrics: { skills: 4, work_ethic: 5, trust: 5 }, clock_in_time: new Date(Date.now() - 7*86400000 - 3*3600000).toISOString(), clock_out_time: new Date(Date.now() - 7*86400000).toISOString() },
    { employer_id: ids.employer, worker_id: ids.avg, worker_name: 'Bakar (Average Student)', worker_avatar: 'https://randomuser.me/api/portraits/men/45.jpg', gig_title: 'Loading Bay Helper', amount: 50, status: 'verified', payment_status: 'paid', rating_given: true, rating: 3, review: 'Was a bit late, but did the job fine.', sweat_metrics: { skills: 3, work_ethic: 3, trust: 4 }, clock_in_time: new Date(Date.now() - 5*86400000 - 5*3600000).toISOString(), clock_out_time: new Date(Date.now() - 5*86400000).toISOString() },
    { employer_id: ids.employer, worker_id: ids.avg, worker_name: 'Bakar (Average Student)', worker_avatar: 'https://randomuser.me/api/portraits/men/45.jpg', gig_title: 'Usher', amount: 0, status: 'completed', payment_status: 'pending', rating_given: true, rating: 1, review: 'Did not show up for the shift.', sweat_metrics: { skills: 1, work_ethic: 1, trust: 1 }, clock_in_time: null, clock_out_time: null },
  ];

  for (const s of shifts) {
    const { error } = await supabase.from('hired_workers').insert(s);
    console.log(`  ${error ? '❌ ' + error.message : '✅'} ${s.worker_name} → ${s.gig_title} (${s.rating}/5)`);
  }

  console.log('\n========================================');
  console.log('🎉 ALL DONE! Login with:');
  console.log('========================================');
  console.log('  Employer:     employer_esg@test.com / password123');
  console.log('  Elite Worker: elite_worker@test.com / password123');
  console.log('  Avg Worker:   avg_worker@test.com   / password123');
  console.log('========================================\n');
}

main().catch(console.error);
