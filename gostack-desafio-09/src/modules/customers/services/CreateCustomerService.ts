import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    const userByEmail = await this.customersRepository.findByEmail(email);

    if (userByEmail) {
      throw new AppError('Customer with email already exists.');
    }

    const customerCreated = await this.customersRepository.create({
      name,
      email,
    });

    return customerCreated;
  }
}

export default CreateCustomerService;
