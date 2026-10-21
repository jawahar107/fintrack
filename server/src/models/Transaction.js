// src/models/Transaction.js
//
// The core model of the app. Has two relations:
//   - belongs to User     (every transaction has an owner)
//   - belongs to Category (every transaction has a category)
//
// We use .withGraphFetched('[category]') to auto-join category data
// so API responses include the category name without extra queries.

const { Model } = require('objection');

class Transaction extends Model {
  static get tableName() {
    return 'transactions';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'type', 'amount', 'date'],
      properties: {
        id:          { type: 'integer' },
        user_id:     { type: 'integer' },
        category_id: { type: ['integer', 'null'] },
        type:        { type: 'string', enum: ['income', 'expense'] },
        // amount is stored as string from DB (DECIMAL type) — coerce in service
        amount:      { type: ['number', 'string'] },
        description: { type: ['string', 'null'], maxLength: 500 },
        date:        { type: 'string' }, // DATE comes back as string from pg
      },
    };
  }

  static get relationMappings() {
    const User = require('./User');
    const Category = require('./Category');

    return {
      // Transaction BELONGS TO a user
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'transactions.user_id',
          to: 'users.id',
        },
      },
      // Transaction BELONGS TO a category
      // Using .withGraphFetched('[category]') on a query auto-runs:
      //   SELECT * FROM categories WHERE id = transactions.category_id
      // and nests the result inside the transaction object.
      category: {
        relation: Model.BelongsToOneRelation,
        modelClass: Category,
        join: {
          from: 'transactions.category_id',
          to: 'categories.id',
        },
      },
    };
  }
}

module.exports = Transaction;
