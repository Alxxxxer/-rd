const mongoose = require('mongoose');
const User = require('../models/User');
const Delegate = require('../models/Delegate');
const Lead = require('../models/Lead');
const ActivityLog = require('../models/ActivityLog');
const connectDB = require('./db');
const env = require('./env');
const { ROLES, USER_STATUS, LEAD_STATUS, REVENUE_STATUS, PAYMENT_METHODS } = require('../constants');

const seedDatabase = async () => {
  try {
    console.log('[SEED] Connecting to database to seed complete CRM mockup data...');
    await connectDB();

    // 1. Clear existing collections to start fresh
    console.log('[SEED] Cleaning existing database collections...');
    await User.deleteMany({});
    await Delegate.deleteMany({});
    await Lead.deleteMany({});
    await ActivityLog.deleteMany({});

    console.log('[SEED] Seeding User accounts...');
    
    // 2. Seed Super Admin
    const superAdmin = new User({
      name: 'Super Admin',
      email: env.SUPER_ADMIN_EMAIL || 'superadmin@salescrm.com',
      password: env.SUPER_ADMIN_PASSWORD || 'Admin@123456',
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE
    });
    await superAdmin.save();
    console.log(`[SEED] Created Super Admin: ${superAdmin.email}`);

    // 3. Seed other users
    const usersData = [
      {
        name: 'Jane Admin',
        email: 'admin@salescrm.com',
        password: 'Password@123',
        role: ROLES.ADMIN,
        status: USER_STATUS.ACTIVE
      },
      {
        name: 'Mike Manager',
        email: 'manager@salescrm.com',
        password: 'Password@123',
        role: ROLES.SALES_MANAGER,
        status: USER_STATUS.ACTIVE
      },
      {
        name: 'Emily Executive',
        email: 'emily@salescrm.com',
        password: 'Password@123',
        role: ROLES.SALES_EXECUTIVE,
        status: USER_STATUS.ACTIVE
      },
      {
        name: 'Eric Executive',
        email: 'eric@salescrm.com',
        password: 'Password@123',
        role: ROLES.SALES_EXECUTIVE,
        status: USER_STATUS.ACTIVE
      },
      {
        name: 'Ethan Executive',
        email: 'ethan@salescrm.com',
        password: 'Password@123',
        role: ROLES.SALES_EXECUTIVE,
        status: USER_STATUS.ACTIVE
      }
    ];

    const users = [];
    for (const u of usersData) {
      const userInstance = new User(u);
      await userInstance.save();
      users.push(userInstance);
      console.log(`[SEED] Created User: ${userInstance.email} (${userInstance.role})`);
    }

    const emilyUser = users.find(u => u.email === 'emily@salescrm.com');
    const ericUser = users.find(u => u.email === 'eric@salescrm.com');
    const ethanUser = users.find(u => u.email === 'ethan@salescrm.com');
    const adminUser = users.find(u => u.email === 'admin@salescrm.com');
    const managerUser = users.find(u => u.email === 'manager@salescrm.com');

    console.log('[SEED] Seeding Campus Delegate profiles...');

    // 4. Seed Delegate Profiles
    const delegatesData = [
      {
        user: emilyUser._id,
        campus: 'Stanford University',
        code: 'STANFORD-DEL-01'
      },
      {
        user: ericUser._id,
        campus: 'Massachusetts Institute of Technology',
        code: 'MIT-DEL-02'
      },
      {
        user: ethanUser._id,
        campus: 'University of California, Berkeley',
        code: 'UCB-DEL-03'
      }
    ];

    const delegates = [];
    for (const d of delegatesData) {
      const delegateInstance = new Delegate(d);
      await delegateInstance.save();
      delegates.push(delegateInstance);
      console.log(`[SEED] Created Delegate: ${delegateInstance.code} at ${delegateInstance.campus}`);
    }

    const stanfordDel = delegates.find(d => d.code === 'STANFORD-DEL-01');
    const mitDel = delegates.find(d => d.code === 'MIT-DEL-02');
    const ucbDel = delegates.find(d => d.code === 'UCB-DEL-03');

    console.log('[SEED] Seeding Leads pipeline with payment details...');

    // 5. Seed Leads
    const leadsData = [
      // Converted & Paid Leads
      {
        name: 'Liam Neeson',
        email: 'liam@neeson.com',
        phone: '+1 555-0101',
        source: 'Google Sheets',
        status: LEAD_STATUS.CONVERTED,
        assignedTo: emilyUser._id,
        delegate: stanfordDel._id,
        amount: 2500,
        paymentStatus: REVENUE_STATUS.PAID,
        paymentMethod: PAYMENT_METHODS.STRIPE,
        followUpDate: null,
        notes: [
          { text: 'Initial contact via web form. Highly interested in AI engineering course.', createdBy: emilyUser._id },
          { text: 'Conducted follow-up call. Answered fee queries.', createdBy: emilyUser._id },
          { text: 'Converted! Paid $2500 full fee via Stripe.', createdBy: emilyUser._id }
        ]
      },
      {
        name: 'Sophia Loren',
        email: 'sophia@loren.com',
        phone: '+1 555-0102',
        source: 'CSV Import',
        status: LEAD_STATUS.CONVERTED,
        assignedTo: ericUser._id,
        delegate: mitDel._id,
        amount: 1800,
        paymentStatus: REVENUE_STATUS.PAID,
        paymentMethod: PAYMENT_METHODS.UPI,
        followUpDate: null,
        notes: [
          { text: 'Imported from campus registrations list.', createdBy: adminUser._id },
          { text: 'Enrolled in Computer Science boot camp and paid via UPI.', createdBy: ericUser._id }
        ]
      },
      {
        name: 'Bruce Wayne',
        email: 'bruce@waynecorp.com',
        phone: '+1 555-0103',
        source: 'Manual',
        status: LEAD_STATUS.CONVERTED,
        assignedTo: ethanUser._id,
        delegate: ucbDel._id,
        amount: 3000,
        paymentStatus: REVENUE_STATUS.PAID,
        paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
        followUpDate: null,
        notes: [
          { text: 'Direct walking registration. Wanted executive MBA course.', createdBy: ethanUser._id },
          { text: 'Approved corporate discount. Payment processed via Bank Transfer.', createdBy: ethanUser._id }
        ]
      },
      {
        name: 'Olivia Wilde',
        email: 'olivia@wilde.com',
        phone: '+1 555-0104',
        source: 'Google Sheets',
        status: LEAD_STATUS.CONVERTED,
        assignedTo: emilyUser._id,
        delegate: stanfordDel._id,
        amount: 1500,
        paymentStatus: REVENUE_STATUS.PAID,
        paymentMethod: PAYMENT_METHODS.CASH,
        followUpDate: null,
        notes: [
          { text: 'Enrolled in UI/UX Design certification. Paid in cash at campus office.', createdBy: emilyUser._id }
        ]
      },
      {
        name: 'John Doe',
        email: 'john@doe.com',
        phone: '+1 555-0105',
        source: 'Manual',
        status: LEAD_STATUS.CONVERTED,
        assignedTo: ericUser._id,
        delegate: mitDel._id,
        amount: 1200,
        paymentStatus: REVENUE_STATUS.PAID,
        paymentMethod: PAYMENT_METHODS.STRIPE,
        followUpDate: null,
        notes: [
          { text: 'Paid registration deposit.', createdBy: ericUser._id }
        ]
      },
      {
        name: 'Emma Watson',
        email: 'emma@watson.com',
        phone: '+1 555-0106',
        source: 'CSV Import',
        status: LEAD_STATUS.CONVERTED,
        assignedTo: ethanUser._id,
        delegate: ucbDel._id,
        amount: 2200,
        paymentStatus: REVENUE_STATUS.PAID,
        paymentMethod: PAYMENT_METHODS.STRIPE,
        followUpDate: null,
        notes: [
          { text: 'Completed Python certification sign up.', createdBy: ethanUser._id }
        ]
      },
      {
        name: 'Tony Stark',
        email: 'tony@stark.com',
        phone: '+1 555-0107',
        source: 'Manual',
        status: LEAD_STATUS.CONVERTED,
        assignedTo: emilyUser._id,
        delegate: stanfordDel._id,
        amount: 2500,
        paymentStatus: REVENUE_STATUS.PAID,
        paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
        followUpDate: null,
        notes: [
          { text: 'Direct payment approved by Sales Manager Mike.', createdBy: emilyUser._id }
        ]
      },
      {
        name: 'Charlotte Bronte',
        email: 'charlotte@bronte.com',
        phone: '+1 555-0108',
        source: 'Google Sheets',
        status: LEAD_STATUS.CONVERTED,
        assignedTo: ericUser._id,
        delegate: mitDel._id,
        amount: 1600,
        paymentStatus: REVENUE_STATUS.PAID,
        paymentMethod: PAYMENT_METHODS.UPI,
        followUpDate: null,
        notes: [
          { text: 'UPI payment verified.', createdBy: ericUser._id }
        ]
      },

      // In-Progress / Contacted Leads (Pending payments)
      {
        name: 'Diana Prince',
        email: 'diana@amazon.com',
        phone: '+1 555-0109',
        source: 'Google Sheets',
        status: LEAD_STATUS.IN_PROGRESS,
        assignedTo: emilyUser._id,
        delegate: stanfordDel._id,
        amount: 2000,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        notes: [
          { text: 'Attended webinar. Inquired about financial aid support.', createdBy: emilyUser._id }
        ]
      },
      {
        name: 'Peter Parker',
        email: 'peter@dailybugle.com',
        phone: '+1 555-0110',
        source: 'Manual',
        status: LEAD_STATUS.CONTACTED,
        assignedTo: ericUser._id,
        delegate: mitDel._id,
        amount: 1500,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
        notes: [
          { text: 'Left voicemail. Will call back tomorrow during lunch hour.', createdBy: ericUser._id }
        ]
      },
      {
        name: 'Clark Kent',
        email: 'clark@dailyplanet.com',
        phone: '+1 555-0111',
        source: 'CSV Import',
        status: LEAD_STATUS.IN_PROGRESS,
        assignedTo: ethanUser._id,
        delegate: ucbDel._id,
        amount: 2500,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        notes: [
          { text: 'Sent syllabus brochure. Client is comparing with other schools.', createdBy: ethanUser._id }
        ]
      },
      {
        name: 'Selina Kyle',
        email: 'selina@kyle.com',
        phone: '+1 555-0112',
        source: 'Manual',
        status: LEAD_STATUS.CONTACTED,
        assignedTo: emilyUser._id,
        delegate: stanfordDel._id,
        amount: 1200,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        notes: [
          { text: 'Discussed schedule timings. Client has class conflict.', createdBy: emilyUser._id }
        ]
      },
      {
        name: 'Arthur Curry',
        email: 'arthur@atlantis.org',
        phone: '+1 555-0113',
        source: 'Google Sheets',
        status: LEAD_STATUS.IN_PROGRESS,
        assignedTo: ericUser._id,
        delegate: mitDel._id,
        amount: 1800,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        notes: [
          { text: 'Call rescheduled due to travel plans.', createdBy: ericUser._id }
        ]
      },
      {
        name: 'Barry Allen',
        email: 'barry@ccpd.gov',
        phone: '+1 555-0114',
        source: 'CSV Import',
        status: LEAD_STATUS.IN_PROGRESS,
        assignedTo: ethanUser._id,
        delegate: ucbDel._id,
        amount: 1500,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        notes: [
          { text: 'Sent payment link. Client is checking with finance team.', createdBy: ethanUser._id }
        ]
      },
      {
        name: 'Hal Jordan',
        email: 'hal@ferrisair.com',
        phone: '+1 555-0115',
        source: 'Manual',
        status: LEAD_STATUS.CONTACTED,
        assignedTo: emilyUser._id,
        delegate: stanfordDel._id,
        amount: 2200,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        notes: [
          { text: 'Spoke with prospect. Requested a demo meeting.', createdBy: emilyUser._id }
        ]
      },
      {
        name: 'Victor Stone',
        email: 'victor@star-labs.com',
        phone: '+1 555-0116',
        source: 'Google Sheets',
        status: LEAD_STATUS.IN_PROGRESS,
        assignedTo: ericUser._id,
        delegate: mitDel._id,
        amount: 2800,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        notes: [
          { text: 'Reviewing group discounts for 3 team members.', createdBy: ericUser._id }
        ]
      },
      {
        name: 'Wanda Maximoff',
        email: 'wanda@maximoff.org',
        phone: '+1 555-0117',
        source: 'CSV Import',
        status: LEAD_STATUS.IN_PROGRESS,
        assignedTo: ethanUser._id,
        delegate: ucbDel._id,
        amount: 1900,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        notes: [
          { text: 'Emailed custom curriculum details.', createdBy: ethanUser._id }
        ]
      },
      {
        name: 'Steve Rogers',
        email: 'steve@shield.gov',
        phone: '+1 555-0118',
        source: 'Manual',
        status: LEAD_STATUS.CONTACTED,
        assignedTo: emilyUser._id,
        delegate: stanfordDel._id,
        amount: 2000,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        notes: [
          { text: 'Requested brochure. Active follow-up scheduled.', createdBy: emilyUser._id }
        ]
      },

      // New Leads
      {
        name: 'Natasha Romanoff',
        email: 'natasha@shield.gov',
        phone: '+1 555-0119',
        source: 'Google Sheets',
        status: LEAD_STATUS.NEW,
        assignedTo: emilyUser._id,
        delegate: stanfordDel._id,
        amount: 2100,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: null,
        notes: []
      },
      {
        name: 'Clint Barton',
        email: 'clint@shield.gov',
        phone: '+1 555-0120',
        source: 'Manual',
        status: LEAD_STATUS.NEW,
        assignedTo: ericUser._id,
        delegate: mitDel._id,
        amount: 1600,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: null,
        notes: []
      },
      {
        name: 'Thor Odinson',
        email: 'thor@asgard.org',
        phone: '+1 555-0121',
        source: 'CSV Import',
        status: LEAD_STATUS.NEW,
        assignedTo: ethanUser._id,
        delegate: ucbDel._id,
        amount: 2500,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: null,
        notes: []
      },
      {
        name: 'Carol Danvers',
        email: 'carol@starforce.com',
        phone: '+1 555-0122',
        source: 'Google Sheets',
        status: LEAD_STATUS.NEW,
        assignedTo: emilyUser._id,
        delegate: stanfordDel._id,
        amount: 2000,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: null,
        notes: []
      },

      // Lost Leads
      {
        name: 'Loki Odinson',
        email: 'loki@asgard.org',
        phone: '+1 555-0123',
        source: 'Manual',
        status: LEAD_STATUS.LOST,
        assignedTo: ericUser._id,
        delegate: mitDel._id,
        amount: 1500,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: null,
        notes: [
          { text: 'Prospect is looking for a fully-funded scholarship only. Out of budget.', createdBy: ericUser._id }
        ]
      },
      {
        name: 'Stephen Strange',
        email: 'stephen@kamartaj.org',
        phone: '+1 555-0124',
        source: 'Google Sheets',
        status: LEAD_STATUS.LOST,
        assignedTo: ethanUser._id,
        delegate: ucbDel._id,
        amount: 3000,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: null,
        notes: [
          { text: 'No response to emails or calls after 5 attempts.', createdBy: ethanUser._id }
        ]
      },
      {
        name: 'Wade Wilson',
        email: 'wade@pool.com',
        phone: '+1 555-0125',
        source: 'CSV Import',
        status: LEAD_STATUS.LOST,
        assignedTo: emilyUser._id,
        delegate: stanfordDel._id,
        amount: 1200,
        paymentStatus: REVENUE_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        followUpDate: null,
        notes: [
          { text: 'Declined interest, enrolled in another bootcamp.', createdBy: emilyUser._id }
        ]
      }
    ];

    const leads = [];
    for (const l of leadsData) {
      const leadInstance = new Lead(l);
      await leadInstance.save();
      leads.push(leadInstance);
    }
    console.log(`[SEED] Created ${leads.length} Leads.`);

    console.log('[SEED] Syncing Delegate stats counts (Assigned / Converted)...');

    // 6. Sync Delegate Counts
    for (const del of delegates) {
      const assignedCount = leads.filter(l => l.delegate.toString() === del._id.toString()).length;
      const convertedCount = leads.filter(l => l.delegate.toString() === del._id.toString() && l.status === LEAD_STATUS.CONVERTED).length;

      await Delegate.findByIdAndUpdate(del._id, {
        assignedLeadsCount: assignedCount,
        convertedLeadsCount: convertedCount
      });
      console.log(`[SEED] Mapped statistics for Delegate ${del.code}: ${assignedCount} assigned, ${convertedCount} converted.`);
    }

    console.log('[SEED] Seeding Activity logs...');

    // 7. Seed Activity Logs
    const activities = [
      {
        user: superAdmin._id,
        action: 'USER_CREATE',
        details: { targetEmail: 'admin@salescrm.com', role: ROLES.ADMIN }
      },
      {
        user: superAdmin._id,
        action: 'USER_CREATE',
        details: { targetEmail: 'manager@salescrm.com', role: ROLES.SALES_MANAGER }
      },
      {
        user: adminUser._id,
        action: 'DELEGATE_CREATE',
        details: { campus: 'Stanford University', code: 'STANFORD-DEL-01' }
      },
      {
        user: adminUser._id,
        action: 'DELEGATE_CREATE',
        details: { campus: 'Massachusetts Institute of Technology', code: 'MIT-DEL-02' }
      },
      {
        user: adminUser._id,
        action: 'DELEGATE_CREATE',
        details: { campus: 'University of California, Berkeley', code: 'UCB-DEL-03' }
      },
      {
        user: emilyUser._id,
        action: 'LEAD_CREATE',
        details: { leadName: 'Liam Neeson' }
      },
      {
        user: emilyUser._id,
        action: 'LEAD_UPDATE',
        details: { leadName: 'Liam Neeson', updatedFields: { status: LEAD_STATUS.CONVERTED, paymentStatus: REVENUE_STATUS.PAID } }
      },
      {
        user: ericUser._id,
        action: 'LEAD_CREATE',
        details: { leadName: 'Sophia Loren' }
      },
      {
        user: ethanUser._id,
        action: 'LEAD_CREATE',
        details: { leadName: 'Bruce Wayne' }
      }
    ];

    for (const act of activities) {
      const log = new ActivityLog(act);
      await log.save();
    }
    console.log(`[SEED] Created ${activities.length} Activity Logs.`);

    console.log('----------------------------------------------------');
    console.log('[SEED] DATABASE SEEDED SUCCESSFULLY!');
    console.log(`[SEED] Super Admin email: ${env.SUPER_ADMIN_EMAIL || 'superadmin@salescrm.com'}`);
    console.log(`[SEED] Staff passwords: Password@123`);
    console.log('----------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[SEED] Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
