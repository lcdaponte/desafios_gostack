import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exists.');
    }

    const productsExists = await this.productsRepository.findAllById(products);

    if (!productsExists.length) {
      throw new AppError('No products.');
    }

    const existentProductIds = productsExists.map(product => product.id);

    const checkInexistentProducts = products.filter(
      product => !existentProductIds.includes(product.id),
    );

    if (checkInexistentProducts.length) {
      throw new AppError(
        `Could not find products. ${checkInexistentProducts[0].id}`,
      );
    }

    const findProductsWithNoQuantityAvailable = products.filter(
      product =>
        productsExists.filter(p => p.id === product.id)[0].quantity <
        product.quantity,
    );

    if (findProductsWithNoQuantityAvailable.length) {
      throw new AppError(`Quantity is not available`);
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: productsExists.filter(p => p.id === product.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: serializedProducts,
    });

    const { order_products } = order;
    const orderedProductsQuantity = order_products.map(product => ({
      id: product.product_id,
      quantity:
        productsExists.filter(p => p.id === product.product_id)[0].quantity -
        product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderedProductsQuantity);

    return order;
  }
}

export default CreateOrderService;
