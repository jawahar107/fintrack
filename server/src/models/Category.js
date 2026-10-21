// src/models/Category.js

const { Model } = require('objection');

class Category extends Model {
  static get tableName() {
    return 'categories';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'type'],
      properties: {
        id:      { type: 'integer' },
        name:    { type: 'string', minLength: 1, maxLength: 100 },
        // Objection validates this against the DB enum values
        type:    { type: 'string', enum: ['income', 'expense'] },
        user_id: { type: ['integer', 'null'] }, // null = system default
      },
    };
  }

  // Objection relation mappings.
  // This tells Objection how the tables relate so we can use
  // .withGraphFetched() to auto-JOIN without writing SQL JOINs manually.
  static get relationMappings() {
    const User = require('./User');
    const Transaction = require('./Transaction');

    return {
      // A category belongs to a user (or no user if it's a system default)
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'categories.user_id',
          to: 'users.id',
        },
      },
      // A category has many transactions
      transactions: {
        relation: Model.HasManyRelation,
        modelClass: Transaction,
        join: {
          from: 'categories.id',
          to: 'transactions.category_id',
        },
      },
    };
  }
}

module.exports = Category;
