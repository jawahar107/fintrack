// src/models/Budget.js
const { Model } = require('objection');

class Budget extends Model {
  static get tableName() { return 'budgets'; }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'category_id', 'month', 'amount'],
      properties: {
        id:          { type: 'integer' },
        user_id:     { type: 'integer' },
        category_id: { type: 'integer' },
        month:       { type: 'string' },  // first day of month: '2024-11-01'
        amount:      { type: ['number', 'string'] },
      },
    };
  }

  static get relationMappings() {
    const Category = require('./Category');
    return {
      category: {
        relation: Model.BelongsToOneRelation,
        modelClass: Category,
        join: { from: 'budgets.category_id', to: 'categories.id' },
      },
    };
  }
}

module.exports = Budget;

