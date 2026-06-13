// scripts/seedDatabase.ts
// Fixed version - works with existing RLS policies

import { supabase } from '../services/api';

export async function seedDatabase() {
  console.log('🌱 Starting database seeding for MVP presentation...');
  
  try {
    // Get current user (must be logged in as employer first)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ Please login as employer first before seeding!');
      console.log('📝 Login with: employer@gigit.com / Employer123!');
      throw new Error('Must be logged in as employer to seed database');
    }

    const employerId = user.id;
    console.log(`✅ Using employer: ${user.email} (${employerId})`);

    // Step 1: Check/Create wallet for employer
    console.log('💰 Setting up employer wallet...');
    
    let { data: existingWallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', employerId)
      .single();

    if (!existingWallet) {
      const { data: newWallet, error: walletError } = await supabase
        .from('wallets')
        .insert({
          user_id: employerId,
          balance: 1500,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (walletError) {
        console.error('Wallet creation error:', walletError);
        throw walletError;
      }
      existingWallet = newWallet;
      console.log('✅ Wallet created with RM 1500');
    } else {
      // Update existing wallet
      await supabase
        .from('wallets')
        .update({ balance: 1500, updated_at: new Date().toISOString() })
        .eq('user_id', employerId);
      console.log('✅ Wallet updated to RM 1500');
    }

    // Step 2: Add initial top-up transaction if not exists
    console.log('📊 Adding transaction history...');
    
    const { count: existingTx } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', employerId);

    if (!existingTx || existingTx === 0) {
      const transactions = [
        { amount: 500, type: 'credit', description: 'Initial wallet setup', daysAgo: 30 },
        { amount: 300, type: 'credit', description: 'Wallet top-up', daysAgo: 20 },
        { amount: 200, type: 'credit', description: 'Bonus credit', daysAgo: 10 },
      ];

      for (const tx of transactions) {
        await supabase.from('wallet_transactions').insert({
          user_id: employerId,
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          status: 'completed',
          created_at: new Date(Date.now() - tx.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      console.log('✅ Transaction history added');
    } else {
      console.log('✅ Transactions already exist');
    }

    // Step 3: Create gigs
    console.log('📋 Creating gig posts...');
    
    const gigs = [
      {
        title: 'Cafe Assistant - Weekend Shift',
        employer: 'KK Cafe',
        employer_id: employerId,
        location_name: 'KK Town, Kota Kinabalu',
        rate: 12,
        period: 'Hour',
        category: 'F&B',
        duration: '6 Hours',
        description: 'Looking for a friendly assistant for weekend morning shifts. Training provided! Perfect for students.',
        tags: ['Weekend', 'Student Friendly', 'Meals Provided', 'No Experience Needed'],
        status: 'active',
        coords: { lat: 5.9749, lng: 116.0724 },
      },
      {
        title: 'Event Crew - Tech Expo',
        employer: 'SICC',
        employer_id: employerId,
        location_name: 'SICC Convention Center',
        rate: 15,
        period: 'Hour',
        category: 'Event',
        duration: '8 Hours',
        description: 'Need crew for registration desk and ushering. Great networking opportunity with tech companies!',
        tags: ['Event', 'Weekend', 'No Experience Needed', 'Professional Attire'],
        status: 'active',
        coords: { lat: 5.9800, lng: 116.0800 },
      },
      {
        title: 'Warehouse Packer',
        employer: 'Logistika SB',
        employer_id: employerId,
        location_name: 'Inanam Industrial Park',
        rate: 11,
        period: 'Hour',
        category: 'Logistics',
        duration: '8 Hours',
        description: 'Help pack and label parcels for delivery. Physical work required but no experience needed.',
        tags: ['Packing', 'Physical Work', 'Immediate Start', 'Overtime Available'],
        status: 'active',
        coords: { lat: 6.0586, lng: 116.1254 },
      },
      {
        title: 'Tutoring - Mathematics',
        employer: 'Smart Learning Center',
        employer_id: employerId,
        location_name: 'Lintas Plaza',
        rate: 25,
        period: 'Hour',
        category: 'Education',
        duration: '3 Hours',
        description: 'Looking for math tutor for Form 5 students. Must be patient and good at explaining concepts.',
        tags: ['Tutoring', 'Math', 'Evening Shift', 'Qualified'],
        status: 'active',
        coords: { lat: 5.9577, lng: 116.0724 },
      },
      {
        title: 'Delivery Rider',
        employer: 'FoodDash',
        employer_id: employerId,
        location_name: 'City Mall',
        rate: 10,
        period: 'Hour',
        category: 'Delivery',
        duration: '4 Hours',
        description: 'Food delivery rider needed for lunch hours. Own transport required.',
        tags: ['Delivery', 'Flexible Hours', 'Own Transport', 'Tips Included'],
        status: 'active',
        coords: { lat: 5.9800, lng: 116.0900 },
      },
    ];

    for (const gig of gigs) {
      const { data: existingGig } = await supabase
        .from('gigs')
        .select('id')
        .eq('title', gig.title)
        .eq('employer_id', employerId)
        .single();

      if (!existingGig) {
        await supabase.from('gigs').insert({
          ...gig,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }
    console.log('✅ Gigs created/verified');

    // Step 4: Create hired workers records (without worker_id to avoid foreign key issues)
    console.log('👥 Creating hired workers records...');
    
    // First, clear existing hired workers for clean state
    await supabase
      .from('hired_workers')
      .delete()
      .eq('employer_id', employerId);

    const hiredWorkers = [
      {
        employer_id: employerId,
        worker_id: null, // Set to null to avoid foreign key constraint
        worker_name: 'Ahmad Rosli',
        worker_avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        gig_title: 'Cafe Assistant',
        amount: 72,
        status: 'active',
        payment_status: 'pending',
        rating_given: false,
        clock_in_time: new Date().toISOString(),
        clock_out_time: null,
      },
      {
        employer_id: employerId,
        worker_id: null,
        worker_name: 'Nurul Hidayah',
        worker_avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        gig_title: 'Event Crew',
        amount: 120,
        status: 'completed',
        payment_status: 'pending',
        rating_given: false,
        clock_in_time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        clock_out_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        employer_id: employerId,
        worker_id: null,
        worker_name: 'Jason Tan',
        worker_avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
        gig_title: 'Warehouse Assistant',
        amount: 88,
        status: 'verified',
        payment_status: 'pending',
        rating_given: true,
        rating: 5,
        review: 'Excellent worker! Very punctual and hardworking. Completed all tasks efficiently.',
        clock_in_time: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        clock_out_time: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
      },
      {
        employer_id: employerId,
        worker_id: null,
        worker_name: 'Priya Kumar',
        worker_avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        gig_title: 'Mathematics Tutor',
        amount: 75,
        status: 'verified',
        payment_status: 'pending',
        rating_given: true,
        rating: 4,
        review: 'Good tutor, students improved their grades. Punctual and prepared.',
        clock_in_time: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        clock_out_time: new Date(Date.now() - 69 * 60 * 60 * 1000).toISOString(),
      },
      {
        employer_id: employerId,
        worker_id: null,
        worker_name: 'Mohd Faisal',
        worker_avatar: 'https://randomuser.me/api/portraits/men/91.jpg',
        gig_title: 'Delivery Rider',
        amount: 40,
        status: 'verified',
        payment_status: 'paid',
        rating_given: true,
        rating: 4,
        review: 'Fast delivery, good communication. Would hire again.',
        clock_in_time: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
        clock_out_time: new Date(Date.now() - 116 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const worker of hiredWorkers) {
      await supabase.from('hired_workers').insert({
        ...worker,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    console.log(`✅ Created ${hiredWorkers.length} hired worker records`);

    // Step 5: Add payment transactions for paid workers
    console.log('💰 Adding payment transactions...');
    
    const paidPayments = [
      { amount: 40, workerName: 'Mohd Faisal', gigTitle: 'Delivery Rider', daysAgo: 5 },
    ];

    for (const payment of paidPayments) {
      const { data: existingPayment } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('description', `Payment to ${payment.workerName} for ${payment.gigTitle}`)
        .eq('user_id', employerId)
        .single();

      if (!existingPayment) {
        await supabase.from('wallet_transactions').insert({
          user_id: employerId,
          amount: payment.amount,
          type: 'debit',
          description: `Payment to ${payment.workerName} for ${payment.gigTitle}`,
          status: 'completed',
          created_at: new Date(Date.now() - payment.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    // Update wallet balance after payments (RM1500 - RM40 = RM1460)
    await supabase
      .from('wallets')
      .update({ balance: 1460, updated_at: new Date().toISOString() })
      .eq('user_id', employerId);

    console.log('\n🎉 DATABASE SEEDING COMPLETE! 🎉\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY:');
    console.log(`   • Wallet Balance: RM 1460`);
    console.log(`   • Active Gigs: 5`);
    console.log(`   • Hired Workers: 5 records`);
    console.log(`   • Pending Payments: RM 355 (Ahmad, Nurul, Jason, Priya)`);
    console.log(`   • Completed Payments: RM 40 (Mohd Faisal)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✨ Refresh the page to see your new data!');
    
    return true;

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Manual seed function for browser console
(window as any).seedDatabase = seedDatabase;