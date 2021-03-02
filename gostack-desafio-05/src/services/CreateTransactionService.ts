import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';

class CreateTransactionService {
  private transactionsRepository: TransactionsRepository;

  constructor(transactionsRepository: TransactionsRepository) {
    this.transactionsRepository = transactionsRepository;
  }

  public execute({
    title,
    value,
    type,
  }: {
    title: string;
    value: number;
    type: 'income' | 'outcome';
  }): Transaction {
    const transaction = new Transaction({ title, value, type });

    const balance = this.transactionsRepository.getBalance();

    if (transaction.type === 'outcome' && transaction.value > balance.total)
      throw new Error('Error');

    const transactionCreated = this.transactionsRepository.create(transaction);

    return transactionCreated;
  }
}

export default CreateTransactionService;
