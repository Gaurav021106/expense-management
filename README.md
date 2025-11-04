Expense Management
A full-stack expense management web application built with Node.js, Express, MongoDB (Mongoose), EJS, session handling, and email verification for secure user sign-up.

Features
User Signup with Email Verification

Login & Logout with session management

Add, View & Delete Expenses

Budget, Total Expenses, Remaining Calculation

Responsive UI with Tailwind Utility Classes

Secure Password Hashing (bcrypt)

Email Notifications (nodemailer)

Tech Stack
Backend: Node.js, Express, MongoDB, Mongoose

Frontend: EJS Templates, Tailwind CSS (utility classes)

Authentication: Express-session, Connect-mongo

Mail Service: Nodemailer, Gmail SMTP

Password Security: bcrypt

Environment Variables: dotenv

Getting Started
Prerequisites
Node.js & npm installed

MongoDB running locally

Gmail account for email verification

Installation
Clone the repo

bash
git clone https://github.com/Gaurav021106/expense-management.git
cd expense-management
Install dependencies

bash
npm install
Configure environment variables

Create a .env file in the root:

text
EMAIL_USER=your_gmail_email@gmail.com
EMAIL_PASS=your_app_password
SESSION_SECRET=your_session_secret
Generate a Gmail App password if 2FA is enabled.

Start MongoDB (Ensure it runs on default port 27017)

Start the server

bash
node index.js
The server runs on http://localhost:8000.

Usage
Signup: Enter your details and verify your email using the code sent to your inbox.

Login: Log in after verification.

Add Expenses: Enter name, amount, and date to track your spending.

View Expenses: See the list of expenses and overall amount.

Delete Expenses: Remove any expense entry.

Budget Management: Set your budget and see remaining balance.

Project Structure
text
expense-management/
│
├── index.js              # Main server logic (routes, authentication, email, expenses)
├── models/
│   ├── user.js           # User schema and logic
│   └── expense.js        # Expense schema and logic
├── views/
│   ├── page/
│   │   └── home.ejs      # Main dashboard (EJS frontend)
│   └── auth/
│       ├── login.ejs
│       └── signup.ejs
├── .env                  # Environment variables
├── package.json
Contributing
Feel free to fork this repo and create pull requests for new features or bug fixes. Feedback and suggestions are always welcome!

License
This project is licensed under the ISC License.

Enjoy tracking your expenses efficiently and securely!
