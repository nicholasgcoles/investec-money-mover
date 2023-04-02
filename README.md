# Investec Money Mover

This repo is responsible for moving money between your transactional Investec account 
and desired Savings/Loan account. The primary goal is keeping the money in your 
transactional account at a minimum and money in your savings/loan account at a maximum.
At the same time, you want to be able to transact freely from your transactional account.

**Please note:**
It is probably a good idea to have some independent mechanism for understand your budgeting 
/ spending amount, as this approach might mask your balances a bit by moving money around.


# How it works
The underlying process is a script that runs every 30 minutes. The script will make sure
that money is sitting in the correct accounts. The logic is as follows:

1. Income goes into your transactional account
2. Script moves that money into your desired savings/loan account
3. You make a payment
4. Script determines whether to move money back into your transactional account 
based on the following parameters
   1. Minimum amount of money you want to keep in your transactional account (MIN_BALANCE)
   2. Available credit facility (FACILITY)

![Diagram](docs/diagram.png "Diagram")


# Getting started
1. First step is to get Investec to enable programmable banking access.
2. Once you have that, you need to create a `.env` file in the root of the project. 
   The contents of the file should be as follows:
   ```
   INVESTEC_USERNAME=your_investec_username
   INVESTEC_PASSWORD=your_investec_password
   INVESTEC_ACCOUNT_NUMBER=your_investec_account_number
   INVESTEC_SAVINGS_ACCOUNT_NUMBER=your_investec_savings_account_number
   INVESTEC_LOAN_ACCOUNT_NUMBER=your_investec_loan_account_number
   ```
3. Click the button below

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify/netlify-statuskit)

