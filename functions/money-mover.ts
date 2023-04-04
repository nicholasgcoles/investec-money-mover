import {
  Handler,
  HandlerEvent,
  HandlerContext,
  schedule,
} from '@netlify/functions';

import { Client, Account } from 'investec-api';

// write a function to get all the necessary environment variables or throw error if missing.
const getAllEnvVars = () => {
  if (
    !process.env.INVESTEC_CLIENT_ID ||
    !process.env.INVESTEC_SECRET ||
    !process.env.INVESTEC_API_KEY ||
    !process.env.TRANSACTIONAL_ACCOUNT_NUMBER ||
    !process.env.SAVINGS_ACCOUNT_NUMBER ||
    !process.env.FACILITY ||
    !process.env.MIN_BALANCE
  ) {
    throw new Error(
      'Missing at least one of the required environment variables'
    );
  }
  return {
    investecClientId: process.env.INVESTEC_CLIENT_ID,
    investecSecret: process.env.INVESTEC_SECRET,
    investecApiKey: process.env.INVESTEC_API_KEY,
    transactionalAccountNumber: process.env.TRANSACTIONAL_ACCOUNT_NUMBER,
    savingsAccountNumber: process.env.SAVINGS_ACCOUNT_NUMBER,
    facility: +process.env.FACILITY,
    minBalance: +process.env.MIN_BALANCE,
  };
};

const transferManager = async () => {
  const {
    investecClientId,
    investecSecret,
    investecApiKey,
    transactionalAccountNumber,
    savingsAccountNumber,
    facility,
    minBalance,
  } = getAllEnvVars();

  if (!Number.isFinite(minBalance) || !Number.isFinite(facility)) {
    console.error('minBalance or facility are not finite numbers');
    return;
  }
  console.log('Signing in to investec...');
  const client = await Client.create(
    investecClientId,
    investecSecret,
    investecApiKey
  );
  const accounts: Account[] = await client.getAccounts();
  const transactionalAccount = accounts.find(
    (a) => a.accountNumber === transactionalAccountNumber
  );
  console.log('Transactional account: ', transactionalAccount);
  const savingsAccount = accounts.find(
    (a) => a.accountNumber === savingsAccountNumber
  );
  console.log('Savings account: ', savingsAccount);
  if (!transactionalAccount || !savingsAccount) {
    throw new Error(
      'Could not find either transactional or savings account in the list of accounts'
    );
  }

  const transactionalAccBalance = await transactionalAccount.getBalance();
  console.log('Transactional account balance: ', transactionalAccBalance);

  // the availableBalance takes the pending transactions into account
  const trueBalance = transactionalAccBalance.availableBalance - facility;
  let diffFromTarget = trueBalance - minBalance;

  // Make sure there are no rounding errors causing this value to be !== 0
  if (Math.abs(diffFromTarget) < 0.5) {
    diffFromTarget = 0;
  }
  if (diffFromTarget === 0) {
    console.log('Target balance reached, doing nothing');
    return;
  }

  let fromAccount, toAccount;
  if (diffFromTarget > 0) {
    // move money into savings
    fromAccount = transactionalAccount;
    toAccount = savingsAccount;
  } else {
    // move savings into money
    fromAccount = savingsAccount;
    toAccount = transactionalAccount;
    // convert to a positive number
    diffFromTarget *= -1;
  }
  console.log('transferring', {
    fromAccount: fromAccount.productName,
    toAccount: toAccount.productName,
    diffFromTarget,
  });

  const reference = `Money Mover - Auto Transfer`;
  const transferResponse = await fromAccount.transfer([
    {
      account: toAccount,
      myReference: reference,
      theirReference: reference,
      amount: diffFromTarget,
    },
  ]);

  console.log('transfer complete', {
    transferResponse: transferResponse[0].Status,
  });
};

const myHandler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  await transferManager();

  return {
    statusCode: 200,
  };
};

const handler = schedule('@hourly', myHandler);

export { handler };

if (process.env.LOCAL_DEV === 'true') {
  transferManager().then();
}
