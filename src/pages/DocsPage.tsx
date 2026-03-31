import { useRef, useState, useCallback, useEffect } from 'react'

export default function DocsPage() {
  const contentRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [statusText, setStatusText] = useState('')

  // Force light mode for this page
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
    return () => {
      document.documentElement.style.colorScheme = ''
    }
  }, [])

  const downloadPDF = useCallback(async () => {
    if (!contentRef.current) return
    setDownloading(true)
    setStatusText('Please wait, this may take a moment...')

    // Dynamically load html2pdf.js
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    script.onload = () => {
      const element = contentRef.current
      if (!element) return

      // Switch nav-preview to light theme for PDF
      const navPreview = element.querySelector('.docs-nav-preview') as HTMLElement | null
      if (navPreview) {
        navPreview.style.background = '#f0f4ff'
        navPreview.style.color = '#1a1a2e'
        navPreview.style.border = '2px solid #0f3460'
        navPreview.querySelectorAll<HTMLElement>('.docs-nav-group').forEach(el => { el.style.color = '#0f3460' })
        navPreview.querySelectorAll<HTMLElement>('.docs-nav-item').forEach(el => {
          el.style.color = el.classList.contains('sub') ? '#555' : '#333'
        })
      }

      const opt = {
        margin: [10, 10, 15, 10],
        filename: 'Church-Management-System-User-Guide.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['h3', 'h4', '.docs-note', '.docs-tip', '.docs-info-box', '.docs-workflow', '.docs-diagram', '.docs-faq-item', '.docs-feature-box', 'tr'] },
      }

      const html2pdf = (window as any).html2pdf
      html2pdf().set(opt).from(element).save().then(() => {
        // Restore nav preview
        if (navPreview) {
          navPreview.style.background = ''
          navPreview.style.color = ''
          navPreview.style.border = ''
          navPreview.querySelectorAll<HTMLElement>('.docs-nav-group, .docs-nav-item').forEach(el => { el.style.color = '' })
        }
        setDownloading(false)
        setStatusText('')
      }).catch(() => {
        if (navPreview) {
          navPreview.style.background = ''
          navPreview.style.color = ''
          navPreview.style.border = ''
          navPreview.querySelectorAll<HTMLElement>('.docs-nav-group, .docs-nav-item').forEach(el => { el.style.color = '' })
        }
        setDownloading(false)
        setStatusText('Error generating PDF. Please try again.')
      })
    }
    document.head.appendChild(script)
  }, [])

  return (
    <>
      <style>{docsStyles}</style>
      <div className="docs-page">
        {/* Cover */}
        <div className="docs-cover">
          <h1>Church Management System</h1>
          <p className="docs-subtitle">Complete Feature Guide for Team Members</p>
          <p className="docs-org">PowerPoint Tribe &bull; March 2026</p>
        </div>

        {/* Download button */}
        <div style={{ textAlign: 'center' }}>
          <button
            className="docs-download-btn"
            onClick={downloadPDF}
            disabled={downloading}
          >
            {downloading ? 'Generating PDF...' : 'Download as PDF'}
          </button>
          {statusText && (
            <p style={{ fontSize: '13px', color: '#888', marginTop: '8px' }}>{statusText}</p>
          )}
        </div>

        {/* Content for PDF generation */}
        <div ref={contentRef}>
          {/* Table of Contents */}
          <div className="docs-toc">
            <h2 className="docs-toc-title">Table of Contents</h2>
            <ol className="docs-toc-list">
              <li><a href="#getting-started">Getting Started</a></li>
              <li><a href="#system-overview">System Overview</a></li>
              <li><a href="#dashboard">Dashboard</a></li>
              <li><a href="#members">Members Management</a></li>
              <li><a href="#first-timers">First Timers (Visitor Management)</a></li>
              <li><a href="#groups">Groups (Districts, Units &amp; Ministries)</a></li>
              <li><a href="#campuses">Campuses</a></li>
              <li><a href="#events">Events</a></li>
              <li><a href="#service-reports">Service Reports (Attendance Tracking)</a></li>
              <li><a href="#finance">Finance &amp; Requisitions</a></li>
              <li><a href="#bulk-email">Bulk Email &amp; Communication <span className="docs-wip">WORK IN PROGRESS</span></a></li>
              <li><a href="#library">Library Management <span className="docs-wip">WORK IN PROGRESS</span></a></li>
              <li><a href="#workers-training">Workers Training <span className="docs-wip">WORK IN PROGRESS</span></a></li>
              <li><a href="#inventory">Inventory Management <span className="docs-wip">WORK IN PROGRESS</span></a></li>
              <li><a href="#roles">User Roles &amp; Permissions</a></li>
              <li><a href="#administration">Administration</a></li>
              <li><a href="#personal-settings">Personal Settings</a></li>
              <li><a href="#public-forms">Public Forms (Shareable Links)</a></li>
              <li><a href="#faq">Frequently Asked Questions</a></li>
            </ol>
          </div>

          {/* 1. Getting Started */}
          <div className="docs-section" id="getting-started">
            <h2>1. Getting Started</h2>
            <p>The PowerPoint Tribe is a multi-campus church, and our Church Management System is the web-based application we use to manage our members, visitors, groups, events, finances, and more. It can be accessed from any device with a web browser &mdash; including phones, tablets, and computers.</p>

            <h3>Logging In</h3>
            <ol className="docs-steps">
              <li>Open the app in your browser using the link provided by your administrator.</li>
              <li>Enter your <strong>email address</strong> and <strong>password</strong>.</li>
              <li>Click <strong>Login</strong>. You will be taken to the Dashboard.</li>
            </ol>

            <h3>Forgot Your Password?</h3>
            <ol className="docs-steps">
              <li>Click <strong>"Forgot Password?"</strong> on the login page.</li>
              <li>Enter your registered email address.</li>
              <li>Check your email inbox (and spam folder) for a password reset link.</li>
              <li>Click the link and set a new password. You can then log in with your new password.</li>
            </ol>

            <h3>First-Time Access</h3>
            <p>The system uses <strong>invitation-based access</strong>. This means you cannot create an account on your own. Instead:</p>
            <ol className="docs-steps">
              <li>An administrator will send you an <strong>email invitation</strong>.</li>
              <li>Click the link in the email to open the setup page.</li>
              <li>Create your password and complete your profile.</li>
              <li>You can now log in and start using the system.</li>
            </ol>

            <h3>What You Can See</h3>
            <p>The app displays different features based on your <strong>role</strong> (see <a href="#roles">Section 15: User Roles &amp; Permissions</a>). For example:</p>
            <ul>
              <li>A <strong>Unit Head</strong> will see only the members within their unit.</li>
              <li>A <strong>District Pastor</strong> will see all members and units within their district.</li>
              <li>An <strong>Admin</strong> or <strong>Super Admin</strong> can see all data across the entire church.</li>
            </ul>
            <div className="docs-tip">Don't worry if you don't see every feature listed in this guide &mdash; you will only see what's relevant to your assigned role.</div>

            <h3>Navigating the App</h3>
            <p>The app has a <strong>sidebar menu</strong> on the left side of the screen. This is your primary way to navigate between different features. The sidebar is organized into sections:</p>
            <div className="docs-diagram">
              <div className="docs-diagram-title">Sidebar Navigation Structure</div>
              <div className="docs-nav-preview">
                <div className="docs-nav-group">Main</div>
                <div className="docs-nav-item">Dashboard</div>
                <div className="docs-nav-group">People</div>
                <div className="docs-nav-item">Members</div>
                <div className="docs-nav-item sub">Reports</div>
                <div className="docs-nav-item sub">Service Reports</div>
                <div className="docs-nav-item">First Timers</div>
                <div className="docs-nav-item sub">Call Reports</div>
                <div className="docs-nav-item sub">Messages</div>
                <div className="docs-nav-item sub">Analytics</div>
                <div className="docs-nav-group">Organization</div>
                <div className="docs-nav-item">Groups</div>
                <div className="docs-nav-item">Campuses</div>
                <div className="docs-nav-item">Events</div>
                <div className="docs-nav-group">Finance</div>
                <div className="docs-nav-item">Requisitions</div>
                <div className="docs-nav-item sub">Approvals</div>
                <div className="docs-nav-item sub">Disbursements</div>
                <div className="docs-nav-group">Administration</div>
                <div className="docs-nav-item">Users / Roles / Audit Logs / Settings</div>
              </div>
            </div>
            <p>On mobile devices, the sidebar collapses into a menu icon (&#9776;) that you can tap to expand.</p>
          </div>

          {/* 2. System Overview */}
          <div className="docs-section" id="system-overview">
            <h2>2. System Overview</h2>
            <p>Our Church Management System is made up of several modules, each handling a specific area of our church operations. Here is an overview of all available modules and their current status:</p>

            <div className="docs-diagram">
              <div className="docs-diagram-title">All System Modules</div>
              <div className="docs-system-overview">
                <div className="docs-module-card"><h4>Dashboard</h4><p>Overview of key metrics and recent activity</p></div>
                <div className="docs-module-card"><h4>Members</h4><p>Manage church member records, profiles, and reports</p></div>
                <div className="docs-module-card"><h4>First Timers</h4><p>Track visitors and manage the follow-up process</p></div>
                <div className="docs-module-card"><h4>Groups</h4><p>Manage districts, units, and ministries</p></div>
                <div className="docs-module-card"><h4>Campuses</h4><p>Manage multiple church locations</p></div>
                <div className="docs-module-card"><h4>Events</h4><p>Create events, manage registrations, and track attendance</p></div>
                <div className="docs-module-card"><h4>Service Reports</h4><p>Record and analyze service attendance</p></div>
                <div className="docs-module-card"><h4>Finance</h4><p>Submit and approve financial requisitions</p></div>
                <div className="docs-module-card"><h4>User Management</h4><p>Invite users, assign roles, and manage access</p></div>
                <div className="docs-module-card"><h4>Audit Logs</h4><p>Track all actions for accountability</p></div>
                <div className="docs-module-card wip"><h4>Bulk Email</h4><p>Send email campaigns to members</p><span className="docs-wip-badge">WORK IN PROGRESS</span></div>
                <div className="docs-module-card wip"><h4>Library</h4><p>Manage books and borrowing records</p><span className="docs-wip-badge">WORK IN PROGRESS</span></div>
                <div className="docs-module-card wip"><h4>Workers Training</h4><p>Manage training programs and cohorts</p><span className="docs-wip-badge">WORK IN PROGRESS</span></div>
                <div className="docs-module-card wip"><h4>Inventory</h4><p>Track church assets and stock items</p><span className="docs-wip-badge">WORK IN PROGRESS</span></div>
                <div className="docs-module-card"><h4>Settings</h4><p>Configure church info, notifications, and security</p></div>
              </div>
            </div>

            <div className="docs-info-box">
              <strong>What does "Work in Progress" mean?</strong> These modules are available and functional in the system, but are still being refined. You can use them, but some features may change or be added as development continues.
            </div>

            <h3>How Information Flows Through the System</h3>
            <p>Here is how a person's journey typically flows through the system, from their first visit to becoming an active member:</p>
            <div className="docs-diagram">
              <div className="docs-diagram-title">Visitor-to-Member Journey</div>
              <div className="docs-workflow">
                <span className="docs-workflow-step active">Person visits church</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step">Registered as First Timer</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step">Assigned for follow-up</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step">Follow-up calls/visits</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step">Ready for integration</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step active">Converted to Member</span>
              </div>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Once converted, the person becomes a full member and can be assigned to a district, unit, and given a role.</p>
            </div>
          </div>

          {/* 3. Dashboard */}
          <div className="docs-section" id="dashboard">
            <h2>3. Dashboard</h2>
            <p>The Dashboard is the <strong>home page</strong> of the system. Every time you log in, this is the first thing you see. It provides a bird's-eye view of the most important numbers and activities across the church. Think of it as your daily command centre.</p>

            <h3>Key Metrics at a Glance</h3>
            <p>At the top of the dashboard, you'll see summary cards showing:</p>
            <div className="docs-feature-grid">
              <div className="docs-feature-box"><h4>Total Members</h4><p>The total number of people who are registered as church members in the system.</p></div>
              <div className="docs-feature-box"><h4>Total First Timers</h4><p>The number of first-time visitors who have been recorded. This includes visitors from public registration forms and those entered manually.</p></div>
              <div className="docs-feature-box"><h4>Active Groups</h4><p>The number of currently active districts, units, and ministries in the church.</p></div>
              <div className="docs-feature-box"><h4>Pending Follow-Ups</h4><p>First timers who have been assigned for follow-up but have not yet been contacted. This number helps you know if there are visitors still waiting to hear from someone.</p></div>
            </div>
            <ul>
              <li><strong>Pending Requisitions</strong> &mdash; Financial requests that are waiting for someone to review and approve them.</li>
              <li><strong>Recent Activity</strong> &mdash; A live feed showing the latest actions taken in the system (e.g., "John Doe added a new member", "Jane approved a requisition").</li>
            </ul>

            <h3>Filtering by Date Range</h3>
            <p>By default, the dashboard shows data for the current period. You can change this to view data for a different time period using the <strong>date range selector</strong>:</p>
            <ul>
              <li><strong>Last Month</strong> &mdash; Data from the past 30 days</li>
              <li><strong>Last 3 Months</strong> / <strong>Last 6 Months</strong> / <strong>Last Year</strong></li>
              <li><strong>Custom Range</strong> &mdash; Pick your own specific start and end dates</li>
            </ul>
            <p>This is useful for understanding trends. For example, you might want to compare how many first timers visited last quarter versus this quarter.</p>

            <h3>Filtering by Campus</h3>
            <p>If your church has multiple campuses (locations), you can filter the entire dashboard to show data for <strong>one specific campus</strong> or <strong>all campuses combined</strong>. This allows campus pastors to focus on their location's data.</p>

            <h3>Quick Actions</h3>
            <p>The dashboard includes shortcut buttons that let you quickly jump to common tasks without navigating through the sidebar:</p>
            <ul>
              <li>Add a new member</li>
              <li>Register a first-time visitor</li>
              <li>Create a service report</li>
              <li>Submit a financial requisition</li>
              <li>Create an event</li>
            </ul>
          </div>

          {/* 4. Members Management */}
          <div className="docs-section" id="members">
            <h2>4. Members Management</h2>
            <p>This is the core module of the system. It stores and manages records for every registered member of our church. Each member has a comprehensive profile containing their personal information, church assignments, and activity history.</p>

            <h3>Viewing Members</h3>
            <ol className="docs-steps">
              <li>Go to <strong>People &gt; Members</strong> from the sidebar.</li>
              <li>You'll see a list of all members you have access to view. The list you see depends on your role:
                <ul>
                  <li><strong>Super Admin / Admin</strong>: Sees all members across all campuses</li>
                  <li><strong>Campus Pastor</strong>: Sees all members at their campus</li>
                  <li><strong>District Pastor</strong>: Sees members in their district</li>
                  <li><strong>Unit Head</strong>: Sees members in their unit</li>
                </ul>
              </li>
              <li>Use the <strong>search bar</strong> to quickly find a specific member by name, email, or phone number.</li>
              <li>Use <strong>filters</strong> to narrow down the list by membership status, district, unit, ministry, or gender.</li>
            </ol>

            <h3>Adding a New Member</h3>
            <p>When a new person officially becomes a church member, you need to create a record for them:</p>
            <ol className="docs-steps">
              <li>Click the <strong>"Add Member"</strong> button at the top of the Members page.</li>
              <li>Fill in the member's details. The form is divided into sections:
                <ul>
                  <li><strong>Basic Info</strong>: First name, last name, phone number, email, date of birth, gender</li>
                  <li><strong>Address</strong>: Street, city, state</li>
                  <li><strong>Church Info</strong>: Campus, district, unit, membership status</li>
                  <li><strong>Professional Info</strong> (optional): Occupation, employer</li>
                  <li><strong>Spiritual Journey</strong> (optional): Baptism date, conversion date</li>
                  <li><strong>Emergency Contact</strong>: Name, phone number, and relationship of someone to contact in an emergency</li>
                </ul>
              </li>
              <li>Click <strong>Save</strong>. The member is now in the system.</li>
            </ol>
            <div className="docs-tip"><strong>Tip:</strong> If you're adding many members at once (e.g., during initial setup or after a major event), use the <strong>Bulk Upload</strong> feature instead of adding them one by one. See <a href="#administration">Section 16: Administration</a>.</div>

            <h3>Viewing a Member's Profile</h3>
            <p>Click on any member's name in the list to open their full profile. The profile page shows:</p>
            <ul>
              <li><strong>Personal details</strong> &mdash; Name, contact info, date of birth, address</li>
              <li><strong>Church assignments</strong> &mdash; Which campus, district, unit, and ministry they belong to</li>
              <li><strong>Role and membership status</strong> &mdash; Their current role and status (e.g., Member, DC, LXL, Pastor)</li>
              <li><strong>Notes</strong> &mdash; Any additional notes recorded about the member</li>
              <li><strong>Activity history</strong> &mdash; A timeline of their activities and changes made to their profile</li>
            </ul>

            <h3>Editing a Member</h3>
            <ol className="docs-steps">
              <li>Open the member's profile by clicking their name.</li>
              <li>Click the <strong>"Edit"</strong> button.</li>
              <li>Make your changes (e.g., update their phone number, change their unit assignment).</li>
              <li>Click <strong>Save</strong> to apply the changes.</li>
            </ol>

            <h3>Membership Status</h3>
            <p>Each member has a <strong>membership status</strong> that indicates their level of involvement and growth in the church:</p>
            <table>
              <thead><tr><th>Status</th><th>What It Means</th></tr></thead>
              <tbody>
                <tr><td><strong>Member</strong></td><td>A regular church member</td></tr>
                <tr><td><strong>DC</strong></td><td>Currently in or completed the Discipleship Class program</td></tr>
                <tr><td><strong>LXL</strong></td><td>League of Xtraordinary Leaders &mdash; an appointed leadership position. LXL members are typically unit heads, ministry directors, associate pastors, campus pastors, or the senior pastor. This is not a class you complete; it is a recognition of appointed leadership.</td></tr>
                <tr><td><strong>Director</strong></td><td>Serving as a ministry director</td></tr>
                <tr><td><strong>Pastor</strong></td><td>Serving as a pastor</td></tr>
                <tr><td><strong>Campus Pastor</strong></td><td>Leading a specific campus</td></tr>
                <tr><td><strong>Senior Pastor</strong></td><td>Senior pastoral leadership</td></tr>
              </tbody>
            </table>

            <h3>Member Analytics &amp; Reports</h3>
            <p>Go to <strong>Members &gt; Reports</strong> or <strong>Members &gt; Analytics</strong> to view charts and statistics about the membership, including:</p>
            <ul>
              <li><strong>Age distribution</strong> &mdash; How members are spread across different age groups</li>
              <li><strong>Gender breakdown</strong> &mdash; Male vs female ratio</li>
              <li><strong>Growth trends</strong> &mdash; How membership numbers have changed over time</li>
              <li><strong>District and unit statistics</strong> &mdash; How many members are in each group</li>
            </ul>
            <p>You can also <strong>export member data to CSV</strong> (a spreadsheet format) for use in Excel or Google Sheets.</p>

            <h3>Bulk Import</h3>
            <p>If you need to add many members at once (e.g., migrating from paper records or another system):</p>
            <ol className="docs-steps">
              <li>Go to <strong>Administration &gt; Bulk Upload</strong>.</li>
              <li>Download the <strong>CSV template</strong> &mdash; this gives you a spreadsheet with the correct column headers.</li>
              <li>Fill in the template with member data (one row per member).</li>
              <li>Upload the completed file.</li>
              <li>The system will process it and show you a summary of results: how many were added successfully, how many had errors, and how many were duplicates.</li>
            </ol>
          </div>

          {/* 5. First Timers */}
          <div className="docs-section" id="first-timers">
            <h2>5. First Timers (Visitor Management)</h2>
            <p>This module is designed to ensure that <strong>no first-time visitor falls through the cracks</strong>. Every person who visits the church for the first time is recorded in this system, assigned to a follow-up team member, and tracked through a structured journey until they either become a member or are appropriately flagged.</p>

            <h3>The First-Timer Journey</h3>
            <p>Every first-time visitor goes through a structured pipeline. The system tracks exactly where each visitor is in this journey:</p>
            <div className="docs-diagram">
              <div className="docs-diagram-title">First-Timer Pipeline</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ boxShadow: 'none', margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center' }}>Stage 1</th>
                      <th style={{ textAlign: 'center' }}>Stage 2</th>
                      <th style={{ textAlign: 'center' }}>Stage 3</th>
                      <th style={{ textAlign: 'center' }}>Stage 4</th>
                      <th style={{ textAlign: 'center' }}>Stage 5</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#0f3460' }}>New Visitor</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#1976d2' }}>Assigned for Follow-Up</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#7b1fa2' }}>Under Follow-Up</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#e65100' }}>Ready for Integration</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#2e7d32' }}>Converted to Member</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>Visitor has been recorded in the system but no one has been assigned to follow up yet.</td>
                      <td style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>A team member has been assigned to reach out to this visitor.</td>
                      <td style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>Active follow-up is in progress. Calls, visits, or messages have been made.</td>
                      <td style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>The visitor has expressed interest in joining and is ready to become a member.</td>
                      <td style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>The visitor's record has been converted into a full member profile.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3>Viewing First Timers</h3>
            <ol className="docs-steps">
              <li>Go to <strong>People &gt; First Timers</strong> from the sidebar.</li>
              <li>You'll see a list of all first-time visitors with their name, phone, date of visit, current status, and who they're assigned to.</li>
              <li>Use <strong>filters</strong> to narrow the list by status, date range, assigned person, or campus.</li>
            </ol>

            <h3>Registering a New First Timer</h3>
            <p>When a new person visits the church, their details should be recorded:</p>
            <ol className="docs-steps">
              <li>Click <strong>"Register Visitor"</strong> on the First Timers page.</li>
              <li>Fill in the form:
                <ul>
                  <li><strong>Name, phone, email</strong> &mdash; Basic contact information</li>
                  <li><strong>Date of visit</strong> &mdash; When they came to church</li>
                  <li><strong>How they heard about the church</strong> &mdash; Friend, social media, outreach, walk-by, etc. This helps track which outreach methods are most effective.</li>
                  <li><strong>Visitor type</strong> &mdash; First time, returning visitor, new to the area, or church shopping</li>
                  <li><strong>Address and family information</strong> (optional)</li>
                  <li><strong>Interests and prayer requests</strong> (optional) &mdash; What areas of church life interest them? Do they have any prayer needs?</li>
                </ul>
              </li>
              <li>Click <strong>Save</strong>. The visitor will appear in the First Timers list with a "New" status.</li>
            </ol>
            <div className="docs-tip"><strong>Self-registration:</strong> Visitors can also register themselves using a <strong>public registration link</strong> that you can share (e.g., via QR code at the door or on social media). See <a href="#public-forms">Section 18: Public Forms</a>.</div>

            <h3>Assigning Follow-Up</h3>
            <p>Once a first timer is recorded, they need to be assigned to a follow-up team member who will reach out to them:</p>
            <ol className="docs-steps">
              <li>Open the first timer's profile by clicking their name.</li>
              <li>Click <strong>"Assign to Someone"</strong>.</li>
              <li>Select a church member from the list to handle the follow-up.</li>
              <li>The assigned person will be notified and the visitor's status changes to "Assigned for Follow-Up".</li>
            </ol>

            <h3>Recording Follow-Up Activities</h3>
            <p>Each time you contact a first timer, you should record what happened. This creates a history trail and ensures the team knows the current state:</p>
            <ol className="docs-steps">
              <li>Open the first timer's profile.</li>
              <li>Click <strong>"Add Follow-Up"</strong>.</li>
              <li>Record the details:
                <ul>
                  <li><strong>Date</strong> &mdash; When you made contact (or attempted to)</li>
                  <li><strong>Method</strong> &mdash; Phone call, WhatsApp, SMS, in-person visit, or email</li>
                  <li><strong>Outcome</strong> &mdash; Successful, no answer, busy, interested, not interested, or needs further follow-up</li>
                  <li><strong>Notes</strong> &mdash; Key details from the conversation (e.g., "She said she'll come next Sunday with her family")</li>
                  <li><strong>Next follow-up date</strong> &mdash; When you plan to follow up again</li>
                </ul>
              </li>
            </ol>

            <h3>Call Reports Dashboard</h3>
            <p>Go to <strong>First Timers &gt; Call Reports</strong> for a team-wide view of follow-up activity. This shows:</p>
            <ul>
              <li>All follow-up calls and contacts made across the team</li>
              <li>Who has made the most calls (helpful for recognising active team members)</li>
              <li>Outcomes breakdown (how many calls were successful vs. no answer, etc.)</li>
              <li>Visitors still awaiting contact</li>
            </ul>

            <h3>My Assigned First Timers</h3>
            <p>If you are a follow-up team member, go to <strong>"My Assigned First Timers"</strong> in the sidebar. This shows <strong>only the visitors assigned to you</strong>, making it easy to focus on your personal follow-up responsibilities without being overwhelmed by the full list.</p>

            <h3>Converting a First Timer to a Member</h3>
            <p>When a first timer has been successfully followed up and is ready to officially join the church:</p>
            <ol className="docs-steps">
              <li>Open their profile.</li>
              <li>Click <strong>"Ready for Integration"</strong> to flag them as ready.</li>
              <li>An admin or authorized person can then click <strong>"Integrate to Member"</strong>. This automatically creates a full member profile using the visitor's existing information &mdash; no need to re-enter their details.</li>
            </ol>

            <h3>Message Drafts</h3>
            <p>Go to <strong>First Timers &gt; Messages</strong> to create and manage <strong>message templates</strong> for follow-up communication. These are pre-written messages that can be reused when reaching out to first timers via SMS or WhatsApp. For example, a "Welcome" template, a "Second Visit Invitation" template, etc.</p>

            <h3>First Timer Analytics</h3>
            <p>Go to <strong>First Timers &gt; Analytics</strong> to see data-driven insights:</p>
            <ul>
              <li><strong>Conversion funnel</strong> &mdash; What percentage of visitors eventually become members?</li>
              <li><strong>Follow-up effectiveness</strong> &mdash; Are follow-ups leading to return visits?</li>
              <li><strong>Status distribution</strong> &mdash; How many visitors are at each stage of the pipeline?</li>
              <li><strong>Trends over time</strong> &mdash; Are visitor numbers increasing or decreasing?</li>
            </ul>
          </div>

          {/* 6. Groups */}
          <div className="docs-section" id="groups">
            <h2>6. Groups (Districts, Units &amp; Ministries)</h2>
            <p>Our church is organized into <strong>three types of groups</strong>. Understanding the distinction between them is important for managing assignments and leadership:</p>

            <table>
              <thead><tr><th>Group Type</th><th>Description</th><th>Leader Title</th></tr></thead>
              <tbody>
                <tr>
                  <td><strong>District</strong></td>
                  <td>An organizational division of the church. Districts help organize the church into manageable sections.</td>
                  <td>District Pastor</td>
                </tr>
                <tr>
                  <td><strong>Unit</strong></td>
                  <td>A service arm of the church where functional duties are carried out. Units are where the actual work happens &mdash; for example, LDI, Beckoners, Chimes and Chills, Waves, Buzz, etc.</td>
                  <td>Unit Head</td>
                </tr>
                <tr>
                  <td><strong>Ministry</strong></td>
                  <td>A group of related units brought together under an overarching vision. For example, the <em>Missions Ministry</em> contains units like Tribesheart, R199, and LDI. The ministry provides strategic direction for its units. Other ministries include Operations, Media, and Discipleship.</td>
                  <td>Ministry Director</td>
                </tr>
              </tbody>
            </table>

            <h3>Church Structure Diagram</h3>
            <p>Here is how these groups relate to each other:</p>
            <div className="docs-diagram">
              <div className="docs-diagram-title">Church Organizational Structure</div>
              <div className="docs-org-chart">
                <div className="docs-org-level">
                  <div className="docs-org-node primary">Church<div className="docs-org-label">Led by Senior Pastor</div></div>
                </div>
                <div className="docs-org-connector">&darr;</div>
                <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#0f3460', fontWeight: 700, marginBottom: '8px' }}>DISTRICT STRUCTURE</div>
                    <div className="docs-org-level">
                      <div className="docs-org-node secondary">District A<div className="docs-org-label">District Pastor</div></div>
                      <div className="docs-org-node secondary">District B<div className="docs-org-label">District Pastor</div></div>
                    </div>
                    <div className="docs-org-connector">&darr;</div>
                    <div style={{ fontSize: '12px', color: '#666', padding: '8px' }}>Members are assigned to a district</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#43a047', fontWeight: 700, marginBottom: '8px' }}>SERVICE STRUCTURE</div>
                    <div className="docs-org-level">
                      <div className="docs-org-node tertiary">Missions Ministry<div className="docs-org-label">Ministry Director</div></div>
                    </div>
                    <div className="docs-org-connector">&darr;</div>
                    <div className="docs-org-level">
                      <div className="docs-org-node" style={{ fontSize: '12px' }}>Tribesheart<div className="docs-org-label">Unit Head</div></div>
                      <div className="docs-org-node" style={{ fontSize: '12px' }}>R199<div className="docs-org-label">Unit Head</div></div>
                      <div className="docs-org-node" style={{ fontSize: '12px' }}>LDI<div className="docs-org-label">Unit Head</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="docs-info-box">
              <strong>Example:</strong> The <em>Missions Ministry</em> (led by a Ministry Director) contains three units: <em>Tribesheart</em>, <em>R199</em>, and <em>LDI</em>. Each unit has its own Unit Head who manages the day-to-day operations, while the Ministry Director provides overarching direction for all three. A member serving in the Tribesheart unit belongs to the Missions Ministry and is also assigned to a district.
            </div>

            <h3>Viewing Groups</h3>
            <ol className="docs-steps">
              <li>Go to <strong>Organization &gt; Groups</strong> from the sidebar.</li>
              <li>Switch between tabs to view <strong>Districts</strong>, <strong>Units</strong>, or <strong>Ministries</strong>.</li>
              <li>Each group card shows its name, leader (if assigned), and the number of members.</li>
            </ol>

            <h3>Creating a Group</h3>
            <ol className="docs-steps">
              <li>Click <strong>"Create Group"</strong>.</li>
              <li>Select the <strong>type</strong>: District, Unit, or Ministry.</li>
              <li>Enter the group name, description, and other details.</li>
              <li>If creating a <strong>Unit</strong>, select which Ministry it belongs to.</li>
              <li>Click <strong>Save</strong>.</li>
            </ol>

            <h3>Managing Group Members</h3>
            <ol className="docs-steps">
              <li>Open a group's details page by clicking on it.</li>
              <li>To <strong>add a member</strong>: Click "Add Member" and search for the person in the members list.</li>
              <li>To <strong>remove a member</strong>: Click the remove button next to their name.</li>
            </ol>
            <p>You can also <strong>bulk add</strong> multiple members to a group at once.</p>

            <h3>Assigning Leadership</h3>
            <p>From a group's details page, authorized users can:</p>
            <ul>
              <li>Assign a <strong>District Pastor</strong> to a district</li>
              <li>Assign a <strong>Unit Head</strong> to a unit</li>
              <li>Assign an <strong>Assistant Unit Head</strong> to a unit</li>
              <li>Assign a <strong>Ministry Director</strong> to a ministry</li>
            </ul>
            <p>When a leader is assigned, they automatically gain visibility over the members within their group.</p>
          </div>

          {/* 7. Campuses */}
          <div className="docs-section" id="campuses">
            <h2>7. Campuses</h2>
            <p>The PowerPoint Tribe is a multi-campus church with <strong>multiple physical locations</strong>. The Campuses module allows us to manage each location separately. Each campus has its own members, service times, and contact information. Data throughout the system (members, first timers, reports, etc.) can be filtered by campus.</p>

            <h3>Viewing Campuses</h3>
            <p>Go to <strong>Organization &gt; Campuses</strong> to see all campuses with:</p>
            <ul>
              <li><strong>Name and location</strong> &mdash; The physical address of the campus</li>
              <li><strong>Contact information</strong> &mdash; Phone number and email for the campus</li>
              <li><strong>Service times</strong> &mdash; When services are held</li>
              <li><strong>Active/inactive status</strong> &mdash; Whether the campus is currently operational</li>
              <li><strong>Member count</strong> &mdash; How many members are assigned to this campus</li>
            </ul>

            <h3>Adding a Campus</h3>
            <ol className="docs-steps">
              <li>Click <strong>"Add Campus"</strong>.</li>
              <li>Enter the campus name, full address, phone, email, and service times.</li>
              <li>Click <strong>Save</strong>.</li>
            </ol>

            <h3>How Campuses Affect the System</h3>
            <p>Campuses are foundational to the system. Here's how they connect to other modules:</p>
            <ul>
              <li><strong>Members</strong> are assigned to a specific campus when their profile is created</li>
              <li><strong>First Timers</strong> are associated with the campus they visited</li>
              <li><strong>Service Reports</strong> are recorded per campus</li>
              <li><strong>Dashboard data</strong> can be filtered by campus</li>
              <li><strong>Public forms</strong> (e.g., visitor registration) can be campus-specific using a unique link</li>
              <li><strong>Campus Pastors</strong> can only see data for their assigned campus</li>
            </ul>
          </div>

          {/* 8. Events */}
          <div className="docs-section" id="events">
            <h2>8. Events</h2>
            <p>The Events module lets you create and manage church events such as conferences, training programs, special services, workshops, and community outreaches. It handles the entire event lifecycle &mdash; from creation and registration to check-in and post-event analytics.</p>

            <h3>Viewing Events</h3>
            <p>Go to <strong>Organization &gt; Events</strong> to see all upcoming and past events.</p>

            <h3>Creating an Event</h3>
            <ol className="docs-steps">
              <li>Click <strong>"Create Event"</strong>.</li>
              <li>Fill in:
                <ul>
                  <li><strong>Event name</strong> and <strong>description</strong> &mdash; What the event is about</li>
                  <li><strong>Date, time, and location</strong> &mdash; When and where it happens</li>
                  <li><strong>Event type</strong> &mdash; Conference, training, workshop, service, or community event</li>
                  <li><strong>Capacity</strong> &mdash; The maximum number of people who can attend</li>
                  <li><strong>Registration settings</strong> &mdash; Whether registration is open or closed, and the deadline</li>
                </ul>
              </li>
              <li>Click <strong>Save</strong>. The event now has its own <strong>public registration page</strong> that you can share.</li>
            </ol>

            <h3>Event Lifecycle</h3>
            <div className="docs-diagram">
              <div className="docs-diagram-title">Event Lifecycle</div>
              <div className="docs-workflow">
                <span className="docs-workflow-step active">Create Event</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step">Open Registration</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step">People Register</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step">Event Day: Check-In</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step active">View Analytics</span>
              </div>
            </div>

            <h3>Event Registration</h3>
            <ul>
              <li>Each event has a <strong>public registration page</strong> with a unique link that can be shared via WhatsApp, social media, email, or printed as a QR code. Anyone with the link can register &mdash; no login required.</li>
              <li>You can also <strong>manually register attendees</strong> from within the system.</li>
              <li>View all registrations from the event's detail page.</li>
            </ul>

            <h3>Check-In</h3>
            <p>On the day of the event, use the <strong>check-in feature</strong> to mark registered attendees as present. The system supports <strong>QR code scanning</strong> for fast, contactless check-in at the door.</p>

            <h3>Event Sessions</h3>
            <p>For multi-day or multi-session events (like conferences or training programs), you can create individual <strong>sessions</strong> within an event. Each session tracks its own attendance and can have <strong>assessment results</strong> for training events.</p>

            <h3>Event Committee &amp; Partnerships</h3>
            <ul>
              <li><strong>Committee</strong> &mdash; Assign team members to the event's organizing committee with specific roles (e.g., coordinator, logistics, media).</li>
              <li><strong>Partnerships</strong> &mdash; Track inquiries from organizations or individuals interested in partnering or sponsoring the event.</li>
            </ul>

            <h3>Event Analytics</h3>
            <p>Each event has its own analytics page showing registration numbers, attendance rates, session completion, and check-in statistics.</p>
          </div>

          {/* 9. Service Reports */}
          <div className="docs-section" id="service-reports">
            <h2>9. Service Reports (Attendance Tracking)</h2>
            <p>Service Reports allow you to record attendance and other metrics for <strong>regular church services</strong> (as opposed to special events). This data builds over time to show trends in service attendance and engagement.</p>

            <h3>Creating a Service Report</h3>
            <ol className="docs-steps">
              <li>Go to <strong>People &gt; Members &gt; Service Reports</strong>.</li>
              <li>Click <strong>"New Report"</strong>.</li>
              <li>Fill in:
                <ul>
                  <li><strong>Service date</strong> &mdash; The date the service was held</li>
                  <li><strong>Service type</strong> &mdash; Sunday 1st Service, Sunday 2nd Service, Midweek Service, Special Event, etc.</li>
                  <li><strong>Attendance count</strong> &mdash; How many people attended</li>
                  <li><strong>New converts</strong> &mdash; How many people gave their lives to Christ during the service</li>
                  <li><strong>Other metrics</strong> (if applicable) &mdash; Tithes, offerings, holy communion participation</li>
                  <li><strong>Campus</strong> &mdash; Which campus this report is for</li>
                </ul>
              </li>
              <li>Click <strong>Save</strong>.</li>
            </ol>

            <h3>Viewing &amp; Analysing Reports</h3>
            <ul>
              <li>Browse all service reports with filters for date range, service type, and campus.</li>
              <li>View <strong>attendance trend charts</strong> &mdash; see how attendance has grown or declined over weeks and months.</li>
              <li><strong>Export reports to PDF</strong> for printing, presentation, or sharing with church leadership.</li>
            </ul>

            <h3>Automatic Calculations</h3>
            <p>The system automatically calculates:</p>
            <ul>
              <li>Average attendance per service type</li>
              <li>Attendance growth or decline trends</li>
              <li>Comparison between campuses</li>
              <li>Month-over-month and year-over-year changes</li>
            </ul>
          </div>

          {/* 10. Finance */}
          <div className="docs-section" id="finance">
            <h2>10. Finance &amp; Requisitions</h2>
            <p>The Finance module manages <strong>financial requisitions</strong> &mdash; formal requests for funds. Every requisition goes through an <strong>approval workflow</strong> to ensure proper authorization before any money is released. This creates accountability and a clear paper trail for all financial decisions.</p>

            <h3>How the Requisition Process Works</h3>
            <div className="docs-diagram">
              <div className="docs-diagram-title">Requisition Approval Workflow</div>
              <div className="docs-workflow">
                <span className="docs-workflow-step">Draft</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step">Submitted</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step active">Approved</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step">Disbursed</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step">Closed</span>
              </div>
              <div className="docs-workflow" style={{ marginTop: '4px', boxShadow: 'none', padding: '8px' }}>
                <span style={{ fontSize: '12px', color: '#888' }}>or</span>
              </div>
              <div className="docs-workflow" style={{ marginTop: 0, paddingTop: 0 }}>
                <span className="docs-workflow-step">Submitted</span>
                <span className="docs-workflow-arrow">&rarr;</span>
                <span className="docs-workflow-step warning">Rejected</span>
                <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>(with reason)</span>
              </div>
            </div>

            <table>
              <thead><tr><th>Stage</th><th>What Happens</th><th>Who Does It</th></tr></thead>
              <tbody>
                <tr><td><strong>Draft</strong></td><td>The requester creates the requisition, fills in details, and can edit it freely before submitting.</td><td>Anyone with requisition permission</td></tr>
                <tr><td><strong>Submitted</strong></td><td>The requisition is sent for review. It can no longer be edited by the requester.</td><td>The requester clicks "Submit"</td></tr>
                <tr><td><strong>Approved / Rejected</strong></td><td>An authorized approver reviews the request and either approves or rejects it (with a reason for rejection).</td><td>Users with approval permission (e.g., Admin, Pastor, Finance Officer)</td></tr>
                <tr><td><strong>Disbursed</strong></td><td>The approved funds are released. The disbursement method and reference are recorded.</td><td>Finance team / Admin</td></tr>
                <tr><td><strong>Closed</strong></td><td>The requisition is marked as fully completed and archived.</td><td>Admin</td></tr>
              </tbody>
            </table>

            <h3>Creating a Requisition</h3>
            <ol className="docs-steps">
              <li>Go to <strong>Finance &gt; Finance</strong> in the sidebar.</li>
              <li>Click <strong>"New Requisition"</strong>.</li>
              <li>Fill in:
                <ul>
                  <li><strong>Purpose/description</strong> &mdash; Clearly explain what the money is needed for</li>
                  <li><strong>Amount</strong> &mdash; How much is being requested</li>
                  <li><strong>Expense category</strong> &mdash; Administrative, Utilities, Maintenance, Events, Equipment, Supplies, etc.</li>
                  <li><strong>Supporting details and attachments</strong> &mdash; Any invoices, quotes, or documents to justify the expense</li>
                </ul>
              </li>
              <li>Click <strong>Save as Draft</strong> (to continue editing later) or <strong>Submit</strong> (to send for approval immediately).</li>
            </ol>
            <div className="docs-tip">Requisitions can also be submitted through a <strong>public form</strong> for people who don't have system login access. See <a href="#public-forms">Section 18</a>.</div>

            <h3>Approving Requisitions</h3>
            <p>If you have approval permissions:</p>
            <ol className="docs-steps">
              <li>Go to <strong>Finance &gt; Approvals</strong>. You'll see all requisitions waiting for your approval.</li>
              <li>Click on a requisition to review all details, including the purpose, amount, and any attachments.</li>
              <li>Click <strong>"Approve"</strong> to authorize the expense, or <strong>"Reject"</strong> (you must provide a reason for rejection so the requester understands why).</li>
            </ol>

            <h3>Disbursing Funds</h3>
            <p>After a requisition has been approved, the finance team releases the funds:</p>
            <ol className="docs-steps">
              <li>Go to <strong>Finance &gt; Disbursements</strong>.</li>
              <li>You'll see all approved requisitions awaiting fund release.</li>
              <li>Click on a requisition, confirm the disbursement, and record the payment method and reference details.</li>
            </ol>

            <h3>Tracking Your Requisitions</h3>
            <p>You can always check the status of your own requisitions from the requisitions list. Filter by status to see only your drafts, submitted, approved, rejected, or disbursed requests.</p>

            <h3>Expense Categories &amp; Custom Form Fields</h3>
            <p>Administrators can configure:</p>
            <ul>
              <li><strong>Expense categories</strong> &mdash; Define the types of expenses that can be selected (e.g., Administrative, Utilities, Maintenance, Staffing, etc.).</li>
              <li><strong>Custom form fields</strong> &mdash; Customize which fields appear on the requisition form, whether they're required or optional, and who can see them. Go to <strong>Finance &gt; Settings &gt; Form Fields</strong>.</li>
            </ul>
          </div>

          {/* 11. Bulk Email */}
          <div className="docs-section" id="bulk-email">
            <h2>11. Bulk Email &amp; Communication</h2>
            <div className="docs-note"><strong>Work in Progress:</strong> This module is available in the system but is still being developed. Some features may change as development continues.</div>
            <p>The Bulk Email module allows you to send email campaigns to members, groups, or custom lists. It supports templates with personalization, scheduling, and delivery tracking.</p>

            <h3>Email Templates</h3>
            <p>Templates are <strong>reusable email layouts</strong> that you can create once and use for multiple campaigns.</p>
            <ol className="docs-steps">
              <li>Go to <strong>Bulk Email &gt; Templates</strong>.</li>
              <li>Click <strong>"New Template"</strong>.</li>
              <li>Write your email with a subject line and rich text content (formatted text, images, and links).</li>
              <li>Use <strong>placeholders</strong> for personalization. For example, writing <code>{'{{firstName}}'}</code> in the template will be automatically replaced with each recipient's first name when the email is sent.</li>
              <li>Save the template for reuse.</li>
            </ol>

            <h3>Creating an Email Campaign</h3>
            <ol className="docs-steps">
              <li>Go to <strong>Bulk Email &gt; Campaigns</strong> and click <strong>"New Campaign"</strong>.</li>
              <li>Choose a saved <strong>template</strong> or write new content.</li>
              <li>Select <strong>recipients</strong>: all members, specific groups (districts, units, ministries), or a custom list.</li>
              <li>Choose when to send: <strong>Send now</strong> (immediately) or <strong>Schedule</strong> (pick a future date and time).</li>
              <li>Click <strong>Send</strong> or <strong>Schedule</strong>.</li>
            </ol>

            <h3>Campaign Types</h3>
            <div className="docs-feature-grid">
              <div className="docs-feature-box"><h4>Newsletter</h4><p>Regular updates and church news</p></div>
              <div className="docs-feature-box"><h4>Announcement</h4><p>Important notices and alerts</p></div>
              <div className="docs-feature-box"><h4>Invitation</h4><p>Event invitations to members</p></div>
              <div className="docs-feature-box"><h4>Reminder</h4><p>Follow-up and event reminders</p></div>
              <div className="docs-feature-box"><h4>Educational</h4><p>Teaching content and devotionals</p></div>
              <div className="docs-feature-box"><h4>Fundraising</h4><p>Giving campaigns and appeals</p></div>
            </div>

            <h3>Email History</h3>
            <p>Go to <strong>Bulk Email &gt; History</strong> to see all previously sent emails, their delivery status (sent or failed), and campaign statistics.</p>
          </div>

          {/* 12. Library */}
          <div className="docs-section" id="library">
            <h2>12. Library Management</h2>
            <div className="docs-note"><strong>Work in Progress:</strong> This module is available in the system but is still being developed. Some features may change as development continues.</div>
            <p>The Library module helps manage a church library &mdash; tracking books, who borrows them, when they're due back, and which books are overdue.</p>

            <h3>Books Catalog</h3>
            <p>Go to <strong>Library &gt; Books</strong> to view all books with their title, author, ISBN, publisher, category, number of copies available, and current availability status.</p>

            <h3>Adding a Book</h3>
            <ol className="docs-steps">
              <li>Click <strong>"Add Book"</strong>.</li>
              <li>Enter the book details: title, author, ISBN, publisher, category, and total quantity.</li>
              <li>Click <strong>Save</strong>.</li>
            </ol>

            <h3>Borrowing &amp; Returning</h3>
            <p><strong>To borrow:</strong> Go to Library &gt; Borrowings &gt; "New Borrowing". Select the member, the book, and set the expected return date.</p>
            <p><strong>To return:</strong> Find the borrowing record in the Borrowings list and click "Return". The book's available quantity is automatically updated.</p>

            <h3>Overdue Tracking</h3>
            <p>Go to <strong>Library &gt; Overdue</strong> to see all books past their return date, along with the borrower's contact information and how many days overdue. You can send reminders from this page.</p>
          </div>

          {/* 13. Workers Training */}
          <div className="docs-section" id="workers-training">
            <h2>13. Workers Training</h2>
            <div className="docs-note"><strong>Work in Progress:</strong> This module is available in the system but is still being developed. Some features may change as development continues.</div>
            <p>The Workers Training module helps manage training programs for church workers using a <strong>cohort-based system</strong>. A cohort is a group of trainees going through a training program together.</p>

            <h3>Managing Cohorts</h3>
            <ol className="docs-steps">
              <li>Go to <strong>Workers Training &gt; Cohorts</strong> to see all cohorts and their status (Active, Completed, Planned).</li>
              <li>Click <strong>"Create Cohort"</strong> to set up a new training program with a title, description, start/end dates, trainer information, and maximum capacity.</li>
            </ol>

            <h3>Enrolling Trainees</h3>
            <p>Go to <strong>Workers Training &gt; Assignment</strong> to add members to a cohort. Members can also self-register through a <strong>public registration form</strong> (see <a href="#public-forms">Section 18</a>).</p>

            <h3>Tracking Progress</h3>
            <p>Track trainee attendance per session, record training outcomes, and monitor completion rates through the trainee statistics page.</p>
          </div>

          {/* 14. Inventory */}
          <div className="docs-section" id="inventory">
            <h2>14. Inventory Management</h2>
            <div className="docs-note"><strong>Work in Progress:</strong> This module is available in the system but is still being developed. Some features may change as development continues.</div>
            <p>The Inventory module helps track church-owned assets and consumable stock items &mdash; chairs, projectors, microphones, stationery, communion supplies, and more.</p>

            <h3>Inventory Dashboard</h3>
            <p>Provides an overview of total items count, stock levels, low stock alerts, and items approaching their expiry dates.</p>

            <h3>Items Management</h3>
            <p>Add and manage inventory items. For each item, you can track:</p>
            <ul>
              <li>Quantity on hand, location, and condition</li>
              <li>Reorder level (the system alerts you when stock drops below this number)</li>
              <li>Cost and expiry dates</li>
            </ul>

            <table>
              <thead><tr><th>Item Status</th><th>What It Means</th></tr></thead>
              <tbody>
                <tr><td><strong>In Stock</strong></td><td>Item is available and quantity is sufficient</td></tr>
                <tr><td><strong>Low Stock</strong></td><td>Quantity has dropped below the reorder level &mdash; action needed</td></tr>
                <tr><td><strong>Out of Stock</strong></td><td>No units currently available</td></tr>
                <tr><td><strong>Overstock</strong></td><td>Quantity exceeds the maximum expected level</td></tr>
              </tbody>
            </table>

            <h3>Stock Movements</h3>
            <p>Record when items are received (incoming), issued or transferred (outgoing), or returned. Each movement can require approval before processing, creating an audit trail.</p>

            <h3>Categories &amp; Reports</h3>
            <p>Organize items into categories (e.g., Electronics, Furniture, Office Supplies). View reports on stock movement history, category-wise breakdowns, and expiry tracking.</p>
          </div>

          {/* 15. Roles */}
          <div className="docs-section" id="roles">
            <h2>15. User Roles &amp; Permissions</h2>
            <p>The system uses <strong>role-based access control</strong> to determine what each user can see and do. Every user is assigned a role, and each role has a specific set of permissions. This ensures that people only access the information they need for their responsibilities.</p>

            <h3>Role Hierarchy</h3>
            <div className="docs-diagram">
              <div className="docs-diagram-title">Role Hierarchy (Highest to Lowest Access)</div>
              <div className="docs-org-chart">
                <div className="docs-org-level">
                  <div className="docs-org-node primary" style={{ minWidth: '200px' }}>Super Admin<div className="docs-org-label">Full system access</div></div>
                  <div className="docs-org-node primary" style={{ minWidth: '200px' }}>Senior Pastor<div className="docs-org-label">Full church oversight</div></div>
                </div>
                <div className="docs-org-connector">&darr;</div>
                <div className="docs-org-level"><div className="docs-org-node secondary" style={{ minWidth: '200px' }}>Admin<div className="docs-org-label">Administrative access</div></div></div>
                <div className="docs-org-connector">&darr;</div>
                <div className="docs-org-level"><div className="docs-org-node" style={{ minWidth: '200px' }}>Campus Pastor<div className="docs-org-label">Campus-level management</div></div></div>
                <div className="docs-org-connector">&darr;</div>
                <div className="docs-org-level"><div className="docs-org-node" style={{ minWidth: '200px' }}>District Pastor<div className="docs-org-label">District-level management</div></div></div>
                <div className="docs-org-connector">&darr;</div>
                <div className="docs-org-level"><div className="docs-org-node" style={{ minWidth: '200px' }}>Unit Head<div className="docs-org-label">Unit-level management</div></div></div>
                <div className="docs-org-connector">&darr;</div>
                <div className="docs-org-level"><div className="docs-org-node" style={{ minWidth: '200px' }}>Member<div className="docs-org-label">Basic access only</div></div></div>
              </div>
            </div>

            <h3>Built-in Roles</h3>
            <table>
              <thead><tr><th>Role</th><th>What They Can Do</th></tr></thead>
              <tbody>
                <tr><td><strong>Super Admin / Senior Pastor</strong></td><td>The highest level of access. Full access to everything &mdash; all members, all campuses, all settings, user management, role management, system configuration, and church-wide oversight across all campuses.</td></tr>
                <tr><td><strong>Admin</strong></td><td>Administrative access. Can manage members, first timers, groups, approve requisitions, view reports, invite users, and perform most operational tasks.</td></tr>
                <tr><td><strong>Campus Pastor</strong></td><td>Manages a specific campus. Can view and manage members, groups, and reports for their assigned campus only.</td></tr>
                <tr><td><strong>District Pastor</strong></td><td>Manages a district. Can view members and units within their district. Cannot see members from other districts.</td></tr>
                <tr><td><strong>Unit Head</strong></td><td>Leads a unit (service arm). Can view members within their unit and manage unit activities.</td></tr>
                <tr><td><strong>Member</strong></td><td>Basic access. Can view their own profile, access first timers assigned to them, and use features that have been specifically assigned to them.</td></tr>
              </tbody>
            </table>

            <h3>Custom Roles</h3>
            <p>In addition to the built-in roles, administrators can create <strong>custom roles</strong> with specific permissions. This is useful for specialized positions. For example:</p>
            <ul>
              <li>A <strong>"Finance Officer"</strong> role with only finance-related permissions</li>
              <li>A <strong>"Follow-Up Coordinator"</strong> role with first-timer management and assignment permissions</li>
              <li>A <strong>"Media Admin"</strong> role with event management and bulk email permissions</li>
            </ul>

            <h3>What Permissions Control</h3>
            <p>Permissions are organized by module. Each module has specific actions that can be individually enabled or disabled for a role:</p>
            <ul>
              <li><strong>Members</strong> &mdash; View, create, edit, delete member records, export data</li>
              <li><strong>First Timers</strong> &mdash; Register visitors, assign follow-ups, record calls, convert to members</li>
              <li><strong>Groups</strong> &mdash; Create groups, assign leaders, manage group members</li>
              <li><strong>Finance</strong> &mdash; Create requisitions, approve/reject requests, disburse funds</li>
              <li><strong>Events</strong> &mdash; Create/manage events, manage registrations, view analytics</li>
              <li><strong>Service Reports</strong> &mdash; Create/view/export attendance reports</li>
              <li><strong>Administration</strong> &mdash; Manage users, roles, settings, and audit logs</li>
            </ul>
          </div>

          {/* 16. Administration */}
          <div className="docs-section" id="administration">
            <h2>16. Administration</h2>
            <p>The Administration section is where system-wide settings, user management, and operational tools are managed. Most of these features are only available to <strong>Super Admins</strong> and <strong>Admins</strong>.</p>

            <h3>User Management</h3>
            <p>Go to <strong>Administration &gt; Users</strong> to see three tabs:</p>
            <ul>
              <li><strong>Active Users</strong> &mdash; People who currently have access to the system</li>
              <li><strong>Pending Invitations</strong> &mdash; People who have been invited but haven't yet set up their account</li>
              <li><strong>Deactivated Users</strong> &mdash; People whose access has been removed</li>
            </ul>

            <h4>Inviting a New User</h4>
            <ol className="docs-steps">
              <li>Click <strong>"Invite User"</strong>.</li>
              <li>Enter the person's <strong>email address</strong>.</li>
              <li>Select a <strong>role</strong> for them (e.g., Admin, Unit Head, Member).</li>
              <li>Select a <strong>campus</strong> (if applicable).</li>
              <li>Optionally, link them to an <strong>existing member record</strong> if they're already a member in the system.</li>
              <li>Click <strong>Send Invitation</strong>.</li>
              <li>They'll receive an email with a link to set their password and begin using the system.</li>
            </ol>

            <h4>Changing a User's Role</h4>
            <p>Find the user in the list, click <strong>"Edit Role"</strong>, select the new role, and click <strong>Save</strong>.</p>

            <h4>Deactivating a User</h4>
            <p>If someone should no longer have access (e.g., they've left the church or changed responsibilities), you can <strong>deactivate</strong> their account. This prevents them from logging in but preserves all their historical data and audit trail.</p>

            <h3>Roles Management</h3>
            <p>Go to <strong>Administration &gt; Roles</strong> to view, create, edit, or delete roles. Each role shows the number of permissions it has and which users are assigned to it.</p>

            <h3>Audit Logs</h3>
            <p>Go to <strong>Administration &gt; Audit Logs</strong> to see a <strong>complete, tamper-proof history</strong> of every action taken in the system. Each log entry records:</p>
            <ul>
              <li><strong>Who</strong> performed the action (the user's name)</li>
              <li><strong>What</strong> they did (created, updated, deleted, viewed, logged in, etc.)</li>
              <li><strong>When</strong> it happened (date and time)</li>
              <li><strong>What changed</strong> (the before and after values for any data modification)</li>
            </ul>
            <p>This is essential for <strong>accountability and troubleshooting</strong>. You can filter logs by date range, specific user, action type, or module.</p>
            <p>Go to <strong>Audit Logs &gt; Statistics</strong> for visual charts showing activity patterns &mdash; which users are most active, which modules are used most, and activity over time.</p>

            <h3>Bulk Upload</h3>
            <p>Go to <strong>Administration &gt; Bulk Upload</strong> to import large numbers of members via CSV files. Download the template, fill in the data in a spreadsheet, upload it, and the system will process it automatically &mdash; showing you successes, errors, and duplicates.</p>

            <h3>Admin Settings</h3>
            <p>Go to <strong>Administration &gt; Admin Settings</strong> to configure system-wide settings:</p>
            <div className="docs-feature-grid">
              <div className="docs-feature-box"><h4>General Settings</h4><p>Church name, address, phone, email, and website. This information appears in system-generated emails and public forms.</p></div>
              <div className="docs-feature-box"><h4>Notification Settings</h4><p>Enable or disable email and SMS notifications, configure follow-up reminders, and set up weekly report emails.</p></div>
              <div className="docs-feature-box"><h4>Security Settings</h4><p>Set password expiry policy, session timeout duration, two-factor authentication, and maximum login attempts.</p></div>
              <div className="docs-feature-box"><h4>System Settings</h4><p>Configure timezone, date format, backup frequency, and maintenance mode (temporarily disables the app for maintenance).</p></div>
            </div>
          </div>

          {/* 17. Personal Settings */}
          <div className="docs-section" id="personal-settings">
            <h2>17. Personal Settings</h2>
            <p>Go to <strong>My Settings</strong> (at the bottom of the sidebar) to manage your <strong>personal preferences</strong>. These settings only affect your own experience and do not impact other users.</p>
            <ul>
              <li><strong>Theme</strong> &mdash; Choose between Light mode, Dark mode, or System (automatically follows your device setting)</li>
              <li><strong>Language</strong> &mdash; Select your preferred display language</li>
              <li><strong>Notifications</strong> &mdash; Turn on or off: email notifications, SMS notifications, push notifications, follow-up reminders, and weekly reports</li>
              <li><strong>Display</strong> &mdash; Toggle compact mode (denser layout) and welcome message visibility</li>
              <li><strong>Change Password</strong> &mdash; Update your login password at any time</li>
            </ul>
          </div>

          {/* 18. Public Forms */}
          <div className="docs-section" id="public-forms">
            <h2>18. Public Forms (Shareable Links)</h2>
            <p>The system includes several <strong>public-facing pages</strong> that can be accessed by <strong>anyone without logging in</strong>. These are designed to be shared widely &mdash; via WhatsApp, social media, email, printed flyers, or QR codes at the church entrance.</p>

            <div className="docs-info-box">
              <strong>How to use:</strong> Replace <code>your-app-url</code> with your church's actual app web address. For campus-specific forms, replace <code>campus-name</code> with the campus slug (a short identifier, e.g., "lagos", "abuja").
            </div>

            <h3>Visitor Registration Form</h3>
            <p><strong>Link:</strong> <code>your-app-url/visitor-registration</code> or <code>your-app-url/visitor-registration/campus-name</code></p>
            <p>Share this with first-time visitors so they can register their own details. The information they submit automatically creates a first-timer record in the system, ready for follow-up assignment. Visitors fill in their name, phone, email, address, how they heard about the church, and prayer requests.</p>

            <h3>Event Registration Form</h3>
            <p><strong>Link:</strong> <code>your-app-url/event-registration/event-name</code></p>
            <p>Each event automatically gets its own unique public registration page. Share this link for people to sign up for the event. The system tracks all registrations and handles capacity limits.</p>

            <h3>Requisition Form</h3>
            <p><strong>Link:</strong> <code>your-app-url/requisition</code> or <code>your-app-url/requisition/campus-name</code></p>
            <p>Allows external stakeholders or team members without system access to submit financial requisitions through a public form. The submitted requisition enters the normal approval workflow just like one created from within the system.</p>

            <h3>Workers Training Registration</h3>
            <p><strong>Link:</strong> <code>your-app-url/workers-training-registration</code></p>
            <p>Allows people to register for workers training programs without needing a system login.</p>
          </div>

          {/* 19. FAQ */}
          <div className="docs-section" id="faq">
            <h2>19. Frequently Asked Questions</h2>

            <h3>General</h3>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: I can't see a feature mentioned in this guide. Why?</p>
              <p className="docs-faq-a">A: Your role may not have permission to access that feature. The system only shows features that are relevant to your assigned role. If you believe you should have access to a specific feature, contact your administrator to review your role permissions.</p>
            </div>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: I forgot my password. What do I do?</p>
              <p className="docs-faq-a">A: Click "Forgot Password?" on the login page. Enter your email address and check your inbox (including spam/junk folder) for a reset link. Click the link to create a new password.</p>
            </div>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: Can I use this on my phone?</p>
              <p className="docs-faq-a">A: Yes. The system is fully mobile-responsive and works on any device with a web browser &mdash; phones, tablets, laptops, and desktop computers. No app download is required.</p>
            </div>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: Who can I contact for technical support?</p>
              <p className="docs-faq-a">A: Contact your system administrator (typically the Super Admin or Admin). They can help with login issues, role changes, and technical questions.</p>
            </div>

            <h3>Members</h3>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: How do I find a specific member?</p>
              <p className="docs-faq-a">A: Go to the Members page and use the search bar at the top. You can search by name, email, or phone number. You can also use the filter options to narrow results by district, unit, membership status, or gender.</p>
            </div>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: How do I move a member to a different unit or district?</p>
              <p className="docs-faq-a">A: Open the member's profile, click "Edit", and change their unit or district assignment from the Church Info section. Click Save to apply.</p>
            </div>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: Can I export the members list?</p>
              <p className="docs-faq-a">A: Yes. On the Members page, look for the Export button. This will download the current list (with any active filters applied) as a CSV file that you can open in Excel or Google Sheets.</p>
            </div>

            <h3>First Timers</h3>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: How do I know which first timers I need to follow up with?</p>
              <p className="docs-faq-a">A: Go to <strong>"My Assigned First Timers"</strong> in the sidebar. This shows only the visitors assigned to you. First timers with a "New" or "Assigned" status are the ones still waiting for contact.</p>
            </div>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: What happens when I mark a first timer as "Ready for Integration"?</p>
              <p className="docs-faq-a">A: This signals to administrators that the visitor has been successfully followed up and is ready to become a full church member. An admin or authorized person can then click "Integrate to Member" to convert their visitor record into a complete member profile &mdash; all their existing information is carried over automatically.</p>
            </div>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: Can visitors register themselves?</p>
              <p className="docs-faq-a">A: Yes. You can share a public visitor registration link (see <a href="#public-forms">Section 18</a>). Visitors who fill out this form will automatically appear in the First Timers list, ready for assignment.</p>
            </div>

            <h3>Finance</h3>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: Who approves my requisition?</p>
              <p className="docs-faq-a">A: Requisitions are approved by users who have the "Approve Requisition" permission. This is typically assigned to Admins, Pastors, or designated Finance Officers. You can see the current status of your requisition at any time from the requisitions list.</p>
            </div>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: Can I edit a requisition after submitting it?</p>
              <p className="docs-faq-a">A: No. Once a requisition has been submitted for approval, it is locked and cannot be edited. This is by design to maintain the integrity of the approval process. You can only edit requisitions that are still in "Draft" status. If changes are needed after submission, contact an admin who can reject it so you can create a corrected version.</p>
            </div>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: How do I know when my requisition is approved or rejected?</p>
              <p className="docs-faq-a">A: You'll receive a notification. You can also check the status at any time from the requisitions list page, which shows the current status of all your requests.</p>
            </div>

            <h3>Groups</h3>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: What's the difference between a District, Unit, and Ministry?</p>
              <p className="docs-faq-a">A: A <strong>District</strong> is an organizational division of the church, led by a District Pastor. A <strong>Unit</strong> is a service arm of the church where functional duties are carried out (like LDI, Beckoners, Chimes and Chills, Waves, or Buzz), led by a Unit Head. A <strong>Ministry</strong> is a group of related units brought together under an overarching vision (like the Missions Ministry containing Tribesheart, R199, and LDI). Other ministries include Operations, Media, and Discipleship. Each ministry is led by a Ministry Director.</p>
            </div>
            <div className="docs-faq-item">
              <p className="docs-faq-q">Q: Can a member belong to multiple groups?</p>
              <p className="docs-faq-a">A: A member is assigned to one district and one unit. Since units are organized into ministries, their ministry is determined by their unit assignment. Each member also belongs to one campus.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="docs-footer">
            <p>This document covers all features of the Church Management System as of March 2026.</p>
            <p>For questions or support, contact your system administrator.</p>
            <p style={{ marginTop: '10px', color: '#aaa' }}>&copy; PowerPoint Tribe Church Management System</p>
          </div>
        </div>
      </div>
    </>
  )
}

const docsStyles = `
  .docs-page {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.7;
    color: #1a1a2e;
    background: #f8f9fa;
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 30px;
  }
  .docs-page * { box-sizing: border-box; }

  /* Cover */
  .docs-cover {
    text-align: center;
    padding: 80px 20px;
    margin-bottom: 50px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    color: white;
    border-radius: 16px;
  }
  .docs-cover h1 { font-size: 36px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.5px; }
  .docs-subtitle { font-size: 18px; opacity: 0.85; margin-bottom: 30px; }
  .docs-org { font-size: 15px; opacity: 0.65; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px; margin-top: 20px; }

  /* Download button */
  .docs-download-btn {
    display: inline-block;
    background: #0f3460;
    color: white;
    padding: 14px 32px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    margin: 20px 0 40px;
    transition: background 0.2s;
  }
  .docs-download-btn:hover { background: #1a1a2e; }
  .docs-download-btn:disabled { opacity: 0.7; cursor: not-allowed; }

  /* TOC */
  .docs-toc {
    background: white;
    border-radius: 12px;
    padding: 35px 40px;
    margin-bottom: 40px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .docs-toc-title { font-size: 24px; margin-bottom: 20px; color: #0f3460; border: none; }
  .docs-toc-list { list-style: none; counter-reset: toc-counter; padding: 0; margin: 0; }
  .docs-toc-list li { counter-increment: toc-counter; margin-bottom: 8px; }
  .docs-toc-list li a {
    text-decoration: none;
    color: #1a1a2e;
    font-size: 15px;
    display: flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 6px;
    transition: background 0.15s;
  }
  .docs-toc-list li a:hover { background: #f0f4ff; }
  .docs-toc-list li a::before {
    content: counter(toc-counter) ".";
    font-weight: 700;
    color: #0f3460;
    min-width: 32px;
    font-size: 14px;
  }
  .docs-wip { color: #e67e22; font-size: 12px; margin-left: 8px; font-weight: 600; }

  /* Section headings */
  .docs-page h2 {
    font-size: 26px;
    color: #0f3460;
    margin: 50px 0 20px;
    padding-bottom: 10px;
    border-bottom: 3px solid #e8edf5;
  }
  .docs-page h3 { font-size: 19px; color: #16213e; margin: 28px 0 12px; page-break-after: avoid; }
  .docs-page h4 { font-size: 16px; color: #333; margin: 20px 0 8px; page-break-after: avoid; }
  .docs-page p { margin-bottom: 14px; color: #333; }
  .docs-page ul, .docs-page ol { margin: 10px 0 18px 24px; color: #333; }
  .docs-page li { margin-bottom: 6px; }
  .docs-page li strong { color: #1a1a2e; }
  .docs-page ul ul, .docs-page ol ul { margin-top: 6px; margin-bottom: 6px; }

  /* Tables */
  .docs-page table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0 24px;
    font-size: 14px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  }
  .docs-page th { background: #0f3460; color: white; padding: 12px 16px; text-align: left; font-weight: 600; }
  .docs-page td { padding: 11px 16px; border-bottom: 1px solid #eef1f6; vertical-align: top; }
  .docs-page tr:last-child td { border-bottom: none; }
  .docs-page tr:nth-child(even) { background: #f8fafd; }

  /* Info boxes */
  .docs-note { background: #fff3e0; border-left: 4px solid #e67e22; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 16px 0 24px; font-size: 14px; }
  .docs-note strong { color: #d35400; }
  .docs-tip { background: #e8f5e9; border-left: 4px solid #43a047; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 16px 0 24px; font-size: 14px; }
  .docs-info-box { background: #e3f2fd; border-left: 4px solid #1976d2; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 16px 0 24px; font-size: 14px; }
  .docs-info-box strong { color: #0d47a1; }

  /* Workflow diagrams */
  .docs-workflow {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 20px 0 28px;
    padding: 20px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 1px 8px rgba(0,0,0,0.05);
  }
  .docs-workflow-step { background: #e8edf5; color: #0f3460; padding: 10px 18px; border-radius: 24px; font-weight: 600; font-size: 13px; white-space: nowrap; }
  .docs-workflow-arrow { color: #0f3460; font-size: 20px; font-weight: bold; }
  .docs-workflow-step.active { background: #0f3460; color: white; }
  .docs-workflow-step.warning { background: #fff3e0; color: #e65100; border: 2px solid #e67e22; }

  /* Diagram containers */
  .docs-diagram { background: white; border-radius: 10px; padding: 24px; margin: 20px 0 28px; box-shadow: 0 1px 8px rgba(0,0,0,0.05); text-align: center; }
  .docs-diagram-title { font-weight: 700; font-size: 15px; color: #0f3460; margin-bottom: 16px; text-align: center; }

  /* Org chart */
  .docs-org-chart { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .docs-org-level { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .docs-org-node { background: #e8edf5; border: 2px solid #0f3460; border-radius: 8px; padding: 10px 20px; font-weight: 600; font-size: 13px; color: #0f3460; text-align: center; min-width: 120px; }
  .docs-org-node.primary { background: #0f3460; color: white; }
  .docs-org-node.secondary { background: #1976d2; color: white; border-color: #1976d2; }
  .docs-org-node.tertiary { background: #43a047; color: white; border-color: #43a047; }
  .docs-org-connector { font-size: 20px; color: #999; }
  .docs-org-label { font-size: 11px; color: #888; margin-top: 2px; font-weight: 400; }
  .docs-org-node.primary .docs-org-label, .docs-org-node.secondary .docs-org-label, .docs-org-node.tertiary .docs-org-label { color: rgba(255,255,255,0.7); }

  /* Section cards */
  .docs-section { background: white; border-radius: 12px; padding: 30px 35px; margin-bottom: 30px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
  .docs-section h2 { margin-top: 0; }

  /* Feature grid */
  .docs-feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0 24px; }
  .docs-feature-box { background: #f0f4ff; border-radius: 8px; padding: 16px; }
  .docs-feature-box h4 { margin: 0 0 6px; font-size: 15px; color: #0f3460; }
  .docs-feature-box p { margin: 0; font-size: 13px; color: #555; line-height: 1.5; }

  /* Code */
  .docs-page code { background: #eef1f6; padding: 3px 8px; border-radius: 4px; font-size: 13px; color: #0f3460; font-family: 'Courier New', monospace; }

  /* Steps */
  .docs-steps { counter-reset: step-counter; list-style: none; margin-left: 0; padding-left: 0; }
  .docs-steps li { counter-increment: step-counter; padding-left: 36px; position: relative; margin-bottom: 12px; }
  .docs-steps li::before {
    content: counter(step-counter);
    position: absolute;
    left: 0;
    top: 1px;
    background: #0f3460;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* System overview grid */
  .docs-system-overview { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 16px 0; }
  .docs-module-card { background: #f0f4ff; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid #d0d9f0; }
  .docs-module-card.wip { background: #fff8e1; border-color: #ffe082; }
  .docs-module-card h4 { margin: 0 0 4px; font-size: 13px; color: #0f3460; }
  .docs-module-card p { margin: 0; font-size: 11px; color: #666; line-height: 1.4; }
  .docs-wip-badge { display: inline-block; background: #e67e22; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-top: 4px; }

  /* Nav preview */
  .docs-nav-preview { background: #1a1a2e; color: white; border-radius: 10px; padding: 20px 24px; font-size: 13px; line-height: 2.2; display: inline-block; text-align: left; min-width: 280px; }
  .docs-nav-group { color: #8899bb; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-top: 10px; }
  .docs-nav-item { padding-left: 12px; }
  .docs-nav-item.sub { padding-left: 32px; color: #aab8d0; font-size: 12px; }

  /* FAQ */
  .docs-faq-item { margin-bottom: 20px; }
  .docs-faq-q { font-weight: 700; color: #0f3460; margin-bottom: 4px; }
  .docs-faq-a { color: #444; padding-left: 4px; }

  /* Footer */
  .docs-footer { text-align: center; padding: 30px; color: #888; font-size: 13px; border-top: 1px solid #e8edf5; margin-top: 50px; }

  /* Print styles */
  @media print {
    .docs-page { font-size: 11pt; }
    .docs-download-btn { display: none !important; }
    .docs-cover { display: none !important; }
    .docs-section { box-shadow: none; border: 1px solid #ddd; }
    .docs-page h3, .docs-page h4 { page-break-after: avoid; }
    .docs-note, .docs-tip, .docs-info-box { page-break-inside: avoid; }
    .docs-workflow { page-break-inside: avoid; }
    .docs-org-chart { page-break-inside: avoid; }
    .docs-feature-box { page-break-inside: avoid; }
    .docs-faq-item { page-break-inside: avoid; }
    .docs-steps li { page-break-inside: avoid; }
    .docs-nav-preview { page-break-inside: avoid; }
    .docs-toc { page-break-inside: avoid; }
    .docs-page table { page-break-inside: avoid; }
    .docs-page tr { page-break-inside: avoid; }
    .docs-page p { orphans: 3; widows: 3; }
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .docs-page { padding: 20px 16px; }
    .docs-cover { padding: 50px 16px; }
    .docs-cover h1 { font-size: 26px; }
    .docs-section { padding: 20px 18px; }
    .docs-toc { padding: 24px 20px; }
    .docs-feature-grid { grid-template-columns: 1fr; }
    .docs-system-overview { grid-template-columns: 1fr 1fr; }
    .docs-nav-preview { min-width: auto; width: 100%; }
  }
`
