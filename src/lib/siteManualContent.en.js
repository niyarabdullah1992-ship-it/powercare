export const MANUAL_META = {
  title: "NiroVera Comprehensive Operations Manual",
  subtitle: "Practical step-by-step guidance for owners, managers, and employees — 2026 edition",
  notice: "Visible tools depend on your role, permissions, station scope, and company plan.",
};

export const MANUAL_CHAPTERS = [
  {
    id: "dashboard", name: "Dashboard and Command Center",
    purpose: "Review today’s operational position, identify risks, and open the records that require action.",
    steps: ["Open Dashboard from the sidebar.", "Confirm the displayed station scope and reporting period.", "Start with critical alerts, then review pending decisions and operating trends."],
    actions: [
      { title: "Review daily indicators", steps: ["Read the Attendance, Tasks, Active Team, and Safety cards at the top of the page.", "Select a card or linked alert to open its source section.", "Compare the current value with the trend shown in Smart Operations.", "Return to Dashboard and confirm the alert count changed after resolving the source record."], note: "All users can review indicators, but values are limited to their permitted stations." },
      { title: "Process pending decisions", steps: ["Open Pending Actions or Decision Queue.", "Select the employee, task, attendance exception, or safety item.", "Read the supporting details before choosing the available action.", "Confirm the decision and verify that the item leaves the pending list."], note: "Approval buttons appear only for managers or HR members with the required permission and scope." },
      { title: "Use the station map and risk forecast", steps: ["Open Stations Map or Risk Forecast.", "Select a station marker or risk row.", "Review the contributing attendance, task, safety, and performance signals.", "Open the linked operational section to correct the underlying record."], note: "Company-wide views are available to the owner and senior management; station managers see assigned stations." }
    ],
    roles: ["Employees see personal attendance, tasks, and points.", "Station managers see assigned stations and teams.", "Owners and senior management see the company command center."],
    rules: ["Dashboard values follow the current user’s station scope.", "Risk scores support decisions but do not replace record review.", "Correct source records in their operational section rather than editing dashboard totals."],
    tips: ["Clear critical alerts first, then review trends and lower-priority notices."]
  },
  {
    id: "employees", name: "Employees and Personnel Files",
    purpose: "Create employee accounts, assign work context, and maintain complete professional records.",
    steps: ["Open Employees from the sidebar.", "Choose a station card or use the global employee search.", "Open an employee card to view or update the permitted profile tabs."],
    actions: [
      { title: "Add an employee", steps: ["Select the destination station, then click Add Employee.", "Enter Name and a unique Email address.", "Choose Role and, where shown, Job Grade and managed station scope.", "Save the employee and confirm the new card appears under the selected station.", "Open Login Access in the employee profile to set or reset the temporary password."], note: "Owners, operations managers, and authorized station/HR managers can add employees within their scope and plan limit." },
      { title: "Edit the professional profile", steps: ["Open the employee card and select Professional Information.", "Update Position, phone, grade, station assignment, and other available fields.", "Open Certificates to add the certificate name, category, dates, and attachment.", "Open Leave to review balances and requests; open Salary only when authorized.", "Save each tab and confirm the updated value appears in the profile summary."], note: "Employees can update permitted personal fields; managers and HR see only profiles inside their scope." },
      { title: "Transfer or remove an employee", steps: ["Open the employee management card.", "For a transfer, choose the new Station and confirm the reassignment.", "Review managed stations and role after the transfer.", "For removal, open Delete Employee Account, read the impact summary, and confirm the destructive action.", "Verify the employee no longer appears in the directory and cannot use the old login."], note: "Only authorized management can transfer or delete accounts; the company owner cannot be removed through employee deletion." }
    ],
    roles: ["Management creates, transfers, and removes employees within scope.", "Employees maintain allowed profile fields.", "HR access follows both permission and station scope."],
    rules: ["Use one unique email per employee.", "Salary, identity, certificates, and leave data are private.", "Changing Role changes permissions and must be reviewed carefully."],
    tips: ["Complete station, role, grade, and login access immediately after creating the employee."]
  },
  {
    id: "stations", name: "Stations and Workplaces",
    purpose: "Maintain workplaces, managers, station types, and the geographic boundary used for attendance.",
    steps: ["Open Stations from the navigation or the station area in Employees.", "Select a station card to open its controls.", "Verify manager, status, location, and attendance boundary."],
    actions: [
      { title: "Create or edit a station", steps: ["Click Add Station.", "Enter Station Name, Location, Type, and Status.", "Save and confirm the station card appears.", "Open the card again to edit the details or assign a Station Manager."], note: "Station creation and structural edits are limited to the company owner or authorized senior management." },
      { title: "Configure the attendance location", steps: ["Open Edit Location on the station card.", "Search for the workplace address or select the point on the map.", "Confirm Latitude and Longitude.", "Enter Radius in meters and save.", "Test Check In from a phone physically located at the workplace."], note: "GPS boundary changes are sensitive administrative settings." },
      { title: "Delete a station safely", steps: ["Open the station menu and choose Delete.", "Review the deletion summary for employees and linked records.", "Move employees and resolve active operational records first.", "Return to Delete Station and confirm the station name when requested."], note: "Only authorized management can delete a station; deletion is blocked when dependencies still require action." }
    ],
    roles: ["Owners and senior management define stations.", "Station managers work within assigned stations.", "Employees see their own station context."],
    rules: ["Attendance verification requires valid coordinates and radius.", "Move employees before deleting a station.", "Always verify location changes from a real mobile device."],
    tips: ["Use consistent station names and test the geofence before launch."]
  },
  {
    id: "attendance", name: "Attendance and Scheduling",
    purpose: "Record verified check-in and check-out, manage shifts, and review lateness and absence.",
    steps: ["Open Attendance and allow location access.", "Review the quick attendance card and today’s schedule.", "Use the tabs for Daily, Schedule, Reports, Analytics, Map, Locations, or Settings as permitted."],
    actions: [
      { title: "Check in and check out", steps: ["Enable precise location on the device.", "Open the attendance card and confirm the displayed station.", "Tap Check In and wait for the location and distance result.", "Confirm the status shows Present or Late with the recorded time.", "At the end of work, open the same card and tap Check Out."], note: "Every employee records their own attendance; the system validates the location against an allowed station." },
      { title: "Create and assign a work schedule", steps: ["Open the Schedule tab.", "Create or edit a Shift Type with Start Time and End Time.", "Select the station and employees.", "Assign the shift to the required weekdays in the schedule grid.", "Save, then verify the employee’s next scheduled day."], note: "Directors, station managers, or HR users with Manage Schedules permission can edit schedules within scope." },
      { title: "Review attendance and export a report", steps: ["Open Daily Dashboard or Monthly Report.", "Choose the employee, station, and period.", "Review Present, Late, Absent, Early Checkout, and Missing Checkout entries.", "Add an exemption or note where the control is available.", "Use PDF or Excel to export the filtered report."], note: "Managers see their teams; HR and senior management visibility follows station scope." }
    ],
    roles: ["Employees record their own attendance.", "Managers review teams and exceptions.", "Authorized management configures schedules and attendance settings."],
    rules: ["Never record attendance for another person.", "Location verification uses saved station coordinates.", "Lateness is calculated from the assigned shift in Riyadh time."],
    tips: ["Correct schedules before relying on lateness and absence reports."]
  },
  {
    id: "tasks", name: "Tasks, Targets, and Folders",
    purpose: "Organize station work into sections, assign measurable tasks, and review evidence-based completion.",
    steps: ["Open Tasks and choose a station folder.", "Open or create a section inside the station.", "Review active, completed, overdue, and pending-review task cards."],
    actions: [
      { title: "Create a section and task", steps: ["Choose the station, click New Section, enter a clear section name, and save.", "Open the section and click Add Task.", "Enter Title, Description, Steps, Priority, Start Date, End Date, and a positive Target.", "Choose an employee or station team and select the Completion Mode.", "Save and confirm the task appears in the selected section."], note: "Managers can create sections and tasks only for stations they are allowed to manage." },
      { title: "Record progress and submit completion", steps: ["Open the assigned task card.", "Review the task steps and required target.", "Add Progress units and a comment; attach files or voice evidence when needed.", "When the target is reached, upload the required completion evidence.", "Submit for Review and confirm the status changes to Pending Review."], note: "The assigned employee records progress; attendance may be required before progress is accepted." },
      { title: "Review, reject, or escalate work", steps: ["Open a task marked Pending Review.", "Inspect progress history, comments, and evidence.", "Choose Approve to complete the task, or Reject and enter a required reason.", "If rejected, the employee may open the dispute control and submit an objection.", "Follow the escalation steps until an authorized reviewer resolves the dispute."], note: "Approval and escalation controls appear only to the current authorized reviewer." }
    ],
    roles: ["Managers create work inside their station scope.", "Assigned employees record progress.", "Authorized reviewers approve or reject evidence."],
    rules: ["The structure is Station → Section → Tasks.", "End Date must follow Start Date and Target cannot be lower than completed progress.", "Final completion requires evidence when configured."],
    tips: ["Use measurable steps and a section name that clearly describes the work stream."]
  },
  {
    id: "payroll", name: "Payroll",
    purpose: "Prepare monthly payroll from employee salary profiles, validate adjustments, and record payment.",
    steps: ["Open Payroll and select a month.", "Choose the visible station scope.", "Review totals and row-level validation before changing payment status."],
    actions: [
      { title: "Prepare a monthly payroll run", steps: ["Select the Payroll Month.", "Click Sync Salaries when current profile salaries must be loaded.", "Filter by station or select the required stations.", "Review Basic Salary, Allowances, Bonus, Deductions, Net Salary, and Currency for every employee.", "Resolve all validation notices before payment."], note: "Only the owner, senior management, or HR with Manage Payroll permission can edit payroll." },
      { title: "Edit salary items and mark payment", steps: ["Find the employee row.", "Enter English digits in Allowances, Bonus, and Deductions.", "Add the payroll note where required and verify Net Salary.", "Save the row, then choose Mark Paid.", "Confirm that a paid row becomes locked against normal editing."], note: "Editing follows HR station scope; paid rows require authorized reversal before further changes." },
      { title: "Export payroll and payslips", steps: ["Confirm the month and station filters.", "Open Payroll Report Export for the aggregate report.", "Choose PDF or Excel and download the file.", "For one employee, open the row action and select Payslip.", "Verify employee name, month, amounts, currency, and payment status in the output."], note: "Exports include only employees visible to the current authorized user." }
    ],
    roles: ["Payroll is restricted to authorized management and HR.", "HR visibility follows its configured station scope."],
    rules: ["Use English digits only for payroll amounts.", "Basic salary must be positive and all adjustments non-negative.", "Do not mark payment before completing validation."],
    tips: ["Complete salary profiles before creating the month’s payroll run."]
  },
  {
    id: "expenses", name: "Expense Management",
    purpose: "Submit receipt-backed expenses, route approvals, and export the station ledger.",
    steps: ["Open Expenses.", "Review the submission form and current approval statistics.", "Use the list and reporting controls for records inside your scope."],
    actions: [
      { title: "Submit an expense", steps: ["Choose Expense Type or enter Custom Type.", "Enter Expense Date, Amount, Currency, Quantity where shown, and Description.", "Choose Single Station, Selected Stations, or All Available Stations.", "Upload the Receipt and verify the calculated total.", "Click Submit and confirm the status is Submitted."], note: "Employees can submit expenses for allowed stations; a positive amount, date, station, and receipt are required." },
      { title: "Complete manager and finance review", steps: ["Open an expense with Submitted status.", "Check requester, stations, amount, description, and receipt.", "Choose Manager Approve or Manager Reject.", "After manager approval, the financial officer opens the same request.", "Choose Finance Approve or Finance Reject and confirm the final status."], note: "Manager review is station-scoped; finance review starts only after manager approval." },
      { title: "Open and export a station ledger", steps: ["Open the relevant station expense page or use the station filter.", "Set the reporting period and review totals.", "Confirm the visible records match the station and period.", "Click PDF or Excel.", "Open the downloaded report and verify the filters printed in its header."], note: "Exports contain only expenses visible to the current user." }
    ],
    roles: ["Employees submit expenses.", "Authorized managers perform the first review.", "Financial officers perform final review."],
    rules: ["A receipt, positive amount, date, and station are mandatory.", "Finance cannot approve before the manager.", "Review access follows station scope."],
    tips: ["Match the description and stations to the receipt before submitting."]
  },
  {
    id: "inventory", name: "Inventory and Materials",
    purpose: "Control station stock, purchases, work issues, transfers, movement history, and reports.",
    steps: ["Open Inventory and select the relevant tab.", "Confirm the station before recording stock activity.", "Use global search or item code to find an existing material before creating another."],
    actions: [
      { title: "Create an item or record a purchase", steps: ["Open Items or Purchases and click the available add control.", "Enter Item Name, Item Code, Station, Quantity, and Minimum Stock.", "For a purchase, enter Supplier, Purchase Date, Unit Price, and Quantity.", "Upload Invoice and item images when available.", "Save and verify the station balance and purchase movement."], note: "Station managers and inventory keepers manage stock inside their station; senior management can work across stations." },
      { title: "Issue material to work", steps: ["Open Consumption or Work Issue.", "Choose Source Station and Item.", "Enter Quantity, Employee, Work Reference, Work Date, and Notes.", "Confirm the available balance, then submit the issue.", "Verify the item balance decreased and a numbered movement was added."], note: "The system blocks quantities greater than available stock." },
      { title: "Transfer stock and review history", steps: ["Open Requests and create a transfer request.", "Choose supplying station, receiving station, item, quantity, and justification.", "The supplying station opens the request and approves or rejects it.", "After approval, verify both station balances in Movement History.", "Open the movement to view before/after balances, trace path, attachments, or Reverse when authorized."], note: "Transfers require review by the supplying station; reversal is limited to authorized management and requires a reason." },
      { title: "Export the inventory period report", steps: ["Open the inventory report panel.", "Choose Station and reporting period.", "Review Items, Purchases, and Movements sections.", "Click PDF or Excel.", "Verify station, period, balances, and movement totals in the downloaded report."], note: "The report includes only stations available to the current role." }
    ],
    roles: ["Inventory keepers and station managers handle local stock.", "Senior management reviews all stations."],
    rules: ["Station stock cannot become negative.", "Use transfer requests rather than editing balances manually.", "Every movement records performer, route, quantity, and balance impact."],
    tips: ["Review low-stock items and export a station report before physical counting."]
  },
  {
    id: "signing", name: "Digital Signing and Verification",
    purpose: "Create a personal signature, sign documents, request multiple signatures, and verify integrity.",
    steps: ["Open Digital Signing.", "Set up My Signature before signing a document.", "Choose self-signing, multi-signing, inbox, or verification."],
    actions: [
      { title: "Save a personal signature and sign a file", steps: ["Open My Signature and choose Draw or Type.", "Create the signature and click Save Signature.", "Open Sign Document and upload a PDF or supported image.", "Use the placement window to choose page, position, and signature size.", "Confirm signing, then download the signed file and keep its Verification ID."], note: "Each user signs only with their own stored identity and signature." },
      { title: "Send a document to multiple signers", steps: ["Open Sign and Send and upload the PDF.", "Add each signer’s Name and Email.", "Open placement and assign fields to each signer where required.", "Review the signer list, expiry, and document, then click Send for Signature.", "Open the inbox to monitor each signer and copy or resend an available signing link."], note: "Authorized creators can send requests; each signer uses an independent private link in the current parallel workflow." },
      { title: "Verify a signed document", steps: ["Open Verify Document.", "Upload the final signed file or enter the Verification ID where offered.", "Start verification.", "Compare the displayed SHA-256 fingerprint and status.", "Treat a mismatch as an altered document and use the audit trail for review."], note: "Verification can confirm integrity but does not grant access to unrelated private records." }
    ],
    roles: ["Users create their own signature.", "Authorized managers create signature requests.", "External signers use a private tokenized link."],
    rules: ["Signing links are private and expire.", "Any file edit after signing changes its fingerprint.", "Download the final completed version, not an intermediate copy."],
    tips: ["Review signer emails and signature positions before sending."]
  },
  {
    id: "files", name: "Company Files",
    purpose: "Store and organize company and station documents in a controlled folder hierarchy.",
    steps: ["Open Files.", "Use the breadcrumb to confirm the current folder.", "Open a folder or use the permitted create and upload controls."],
    actions: [
      { title: "Create and navigate folders", steps: ["At the required location, click New Folder.", "Enter a clear Folder Name and save.", "Open the folder card to move inside it.", "Use the breadcrumb or Back control to return to a parent folder."], note: "Folder creation is available only to users with file-management permission." },
      { title: "Upload a station file", steps: ["Open the destination folder and click Upload File.", "Choose the file from the device.", "Select the Station when the document belongs to one workplace.", "Wait for the upload progress to finish.", "Confirm the file row shows name, uploader, date, and station."], note: "Users can upload and view only within their permitted company and station scope." },
      { title: "Rename, download, or delete", steps: ["Open the file or folder action menu.", "Choose Rename, enter the new name, and save; or choose Download to obtain the stored file.", "To remove an item, choose Delete.", "Read the confirmation message and confirm.", "Verify the item disappears from the current folder."], note: "Destructive controls are hidden from users without management permission." }
    ],
    roles: ["Management handles company files.", "Station-scoped users see permitted station files."],
    rules: ["Store uploaded files by URL, not as large text content.", "Assign sensitive station files to the correct station.", "Review nested contents before deleting a folder."],
    tips: ["Use the naming format Department — Subject — Date."]
  },
  {
    id: "safety", name: "Occupational Safety HSE",
    purpose: "Record safety metrics, risks, inspections, permits, incidents, and approvals by station.",
    steps: ["Open Safety and choose a station.", "Start with Overview and HSE KPI tabs.", "Open the operational tab for the record you need to create or review."],
    actions: [
      { title: "Record a risk assessment", steps: ["Open Risk Assessment and click Add Risk.", "Enter the hazard, location, Probability, Severity, and affected work.", "Add Corrective Action, Responsible Person, and Due Date.", "Save and confirm the calculated risk level.", "Update the action and evidence until the risk is closed."], note: "Safety managers and authorized station management can create risks inside their scope." },
      { title: "Complete a checklist or work permit", steps: ["Open Safety Checklist or Permit to Work.", "Choose station, date, work type, and responsible parties.", "Complete every checklist item and required custom field.", "Attach notes or evidence for failed or conditional items.", "Submit for approval and verify the approval history."], note: "Approval requires the designated safety or management role; incomplete requirements cannot be approved." },
      { title: "Record an incident and export HSE results", steps: ["Open the incident or station safety log.", "Enter incident Date, Description, classification, and immediate action.", "Assign corrective action and follow-up owner.", "Update Daily Hours or LTI entries when the incident affects HSE metrics.", "Choose the period and export the HSE Safety Report."], note: "Only authorized safety users can edit incident and metric records; viewers have read-only access." }
    ],
    roles: ["Authorized users view station safety.", "Safety and management roles create records.", "Approvers require explicit authority."],
    rules: ["Open hazards prevent an unqualified safe approval.", "Use factual dates and complete evidence.", "Every corrective action needs an owner and due date."],
    tips: ["Review open corrective actions before recording the station as safe."]
  },
  {
    id: "performance", name: "Performance and Analytics",
    purpose: "Compare employee and station results, inspect trends, and review operational issues.",
    steps: ["Open Performance.", "Choose employee, station, or comparison view.", "Set a consistent reporting period before interpreting results."],
    actions: [
      { title: "Review an employee performance report", steps: ["Open the Individual view.", "Select the employee and period.", "Review completed tasks, progress, points, lateness, and recorded issues.", "Open a linked task or issue for evidence.", "Use the report action to export the visible result."], note: "Employees see their own performance; managers and HR see employees inside scope." },
      { title: "Compare stations or groups", steps: ["Open Station Comparison or Group Comparison.", "Select two stations or two groups.", "Choose the same date range for both sides.", "Review volume, completion rate, points, attendance, and issues together.", "Export PDF or Excel when required."], note: "Company comparisons are limited to stations visible to the current user." },
      { title: "Adjust employee points", steps: ["Open the employee performance details.", "Choose Add Points or Deduct Points.", "Enter the number of points and a clear reason.", "Confirm the adjustment.", "Verify the updated balance and history entry."], note: "Only authorized managers can adjust points; points are not salary or a standalone disciplinary decision." }
    ],
    roles: ["Employees review personal results.", "Managers compare teams in scope.", "Senior management compares company stations."],
    rules: ["Use equal periods and comparable work types.", "Read percentages together with workload volume.", "Points do not replace formal payroll or disciplinary processes."],
    tips: ["Open underlying tasks and issues before acting on a summary metric."]
  },
  {
    id: "hr", name: "Human Resources and Hierarchy",
    purpose: "Configure HR levels, station groups, permissions, holders, and escalation paths.",
    steps: ["Open Human Resources.", "Review the hierarchy and active levels.", "Confirm both permission and scope before assigning a holder."],
    actions: [
      { title: "Create a station group", steps: ["Open Station Groups.", "Click Add Group and enter the group name.", "Select the stations that belong to the group.", "Save and confirm the group appears in the editor.", "Use the group as scope when configuring an HR level."], note: "Only the company owner or authorized HR structure manager can change station groups." },
      { title: "Create an HR level", steps: ["Click Add HR Level.", "Enter the level Name and choose Manager or Assistant role type.", "Choose Station, Cluster, or Company Scope.", "Select each required permission, such as employees, payroll, schedules, files, or complaints.", "Set the order, activate the level, and save."], note: "The owner and authorized top HR management configure levels; permission and scope are enforced together." },
      { title: "Assign a holder and verify escalation", steps: ["Open the required HR level.", "Click Assign Employee and choose an eligible employee.", "Confirm station or cluster assignment where requested.", "Save and inspect the organization chart.", "Check that no active escalation level is left without a responsible holder."], note: "Multi-station assignment is restricted to the company owner or the highest active HR holder." }
    ],
    roles: ["Owners and authorized HR managers configure structure.", "Each HR holder receives explicit permissions and scope."],
    rules: ["Permission alone never opens a station outside scope.", "Assistants do not automatically inherit manager permissions.", "Inactive levels do not receive new assignments or escalations."],
    tips: ["Keep every active escalation level assigned to a responsible employee."]
  },
  {
    id: "reports", name: "Daily Reports and Exports",
    purpose: "Review daily tasks, issues, and actions, then create a correctly scoped report.",
    steps: ["Open Daily Report.", "Choose the day or reporting period.", "Review every source section before exporting."],
    actions: [
      { title: "Review the daily operational report", steps: ["Select the required date.", "Read the summary cards for tasks, issues, and actions.", "Open Today’s Tasks and verify station and status.", "Review Issues and the action/comment history.", "Correct inaccurate information in its source section, then refresh the report."], note: "The report automatically follows the current user’s allowed employees and stations." },
      { title: "Configure report branding", steps: ["Open Branding Settings when visible.", "Upload or select the Company Logo.", "Choose the report accent color and permitted identity fields.", "Save settings.", "Preview a report before distributing it."], note: "Branding settings are restricted to authorized management." },
      { title: "Export PDF or Excel", steps: ["Open Export Center.", "Choose report type, station or group, and date range.", "Confirm the preview contains the expected records.", "Click PDF for printing or Excel for analysis.", "Verify the report header shows the correct scope and period."], note: "Exports never expand beyond the current user’s data permissions." }
    ],
    roles: ["Employees see permitted personal activity.", "Managers see assigned stations.", "Senior management can consolidate company results."],
    rules: ["Exports reflect saved data at generation time.", "Correct data at its source before export.", "Do not export employee data outside your scope."],
    tips: ["Always verify station and period in the exported header."]
  },
  {
    id: "complaints", name: "Complaints and Anonymous Reports",
    purpose: "Submit identified or anonymous reports and follow structured responses and escalation.",
    steps: ["Open Complaints.", "Choose the report type, priority, and station.", "Use My Reports or the management folders to follow status."],
    actions: [
      { title: "Submit a complaint or suggestion", steps: ["Click New Report.", "Choose Complaint or Suggestion, Priority, and Station.", "Write the facts in the Message field and add attachments or voice evidence if needed.", "Choose identified, confidential, or anonymous mode when available.", "Submit and keep the displayed tracking record."], note: "Employees can submit reports within allowed limits; a station is required for anonymous routing." },
      { title: "Respond and resolve", steps: ["Open a report from the station folder.", "Review priority, history, attachments, and current escalation level.", "Add a response or request more information.", "Choose Resolve or Reject and enter the required reason.", "Confirm the new status and response are visible to the reporter."], note: "Station managers and HR can respond only at their authorized scope and current level." },
      { title: "Escalate an unresolved report", steps: ["Open the unresolved report.", "Review previous responses and the escalation path.", "Click Escalate.", "Confirm the next responsible level.", "Verify the report status and current handler changed."], note: "Escalation moves one configured level at a time and requires an active responsible holder." }
    ],
    roles: ["Employees submit and follow their reports.", "Managers and HR respond within scope.", "Owners manage reporting limits and unresolved routing."],
    rules: ["Do not reveal identity inside the text of an anonymous report.", "Usage limits prevent repeated misuse.", "Confidential records have stricter visibility."],
    tips: ["Provide factual evidence without adding unrelated personal information."]
  },
  {
    id: "chat", name: "Chat and Internal Email",
    purpose: "Communicate through station rooms, groups, direct messages, media, and official internal email.",
    steps: ["Open Chat.", "Choose a station room, group, or colleague.", "Use search and media tools to retrieve earlier communication."],
    actions: [
      { title: "Send a message or attachment", steps: ["Choose the conversation from Contacts.", "Type in the Message field.", "Use Attach for a file or the microphone for a voice recording.", "Click Send and wait for the message to appear in the conversation.", "Open the attachment once to verify it uploaded correctly."], note: "Users can communicate only in rooms and contacts available to their company and station scope." },
      { title: "Search or manage a message", steps: ["Open Chat Search and enter a keyword or sender.", "Select a result to return to the message.", "Use Media Gallery to browse files, images, or audio.", "Open the message menu to Delete for Everyone within the allowed window, or hide a direct message locally afterward."], note: "Delete-for-everyone is time-limited; later hiding affects only the current user’s direct-message view." },
      { title: "Create a group or send internal email", steps: ["Open Group Manager to create a group.", "Enter the group name and select permitted members.", "Save and open the new group conversation.", "For email, open Email Composer, choose a registered employee, enter Subject and Body, then send.", "Confirm the success message."], note: "Group management follows role rules; built-in email sends only to registered app users." }
    ],
    roles: ["Employees use available rooms and direct messages.", "Authorized users manage groups and station links."],
    rules: ["Sender identity comes from the active session.", "Do not move private operational data into unauthorized rooms.", "Internal email recipients must be registered users."],
    tips: ["Use attachments for documents instead of pasting long sensitive content."]
  },
  {
    id: "niro", name: "Niro Smart Assistant",
    purpose: "Ask questions, analyze permitted data, and review proposed actions before execution.",
    steps: ["Open Assistant from the sidebar.", "Ask a specific question with station and period when relevant.", "Review every result or approval card before accepting an action."],
    actions: [
      { title: "Ask a data question", steps: ["Type a focused question in the message box or choose a Suggested Question.", "Include the employee, station, date, or period needed for the answer.", "Click Send and wait for the thinking indicator to finish.", "Review the answer and open any linked source section.", "Ask a follow-up question if the scope or period needs correction."], note: "The assistant receives only the data context allowed for the current user." },
      { title: "Run an assisted action", steps: ["Describe the requested task, target employee or station, and required result.", "Wait for the Automation Approval Card.", "Read the exact proposed action and affected records.", "Choose Approve to execute or Reject to cancel.", "Verify the success result and check the affected operational section."], note: "Write actions require the same role permission as performing the action manually and always require explicit review." },
      { title: "Use voice or create a document", steps: ["Tap the microphone and record the request, then stop recording.", "Review the transcribed request before sending.", "For a document, specify title, purpose, period, and whether a signature is needed.", "Open the generated A4 document result.", "Review the data, then use the browser print control to save PDF."], note: "Users must verify sensitive facts before distributing an assistant-generated document." }
    ],
    roles: ["Every user receives role-scoped assistance.", "Only authorized roles can approve write actions."],
    rules: ["Assistant actions do not bypass permissions.", "Never approve an action without reviewing the affected records.", "Unavailable data must not be treated as confirmed information."],
    tips: ["Mention station, period, and desired output in the first request."]
  }
];