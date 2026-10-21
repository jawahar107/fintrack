// src/models/User.js
//
// Objection.js Model — maps the `users` DB table to a JavaScript class.
//
// What does Objection give us over raw Knex?
//   - A class we can attach methods to (e.g. verifyPassword)
//   - Built-in JSON Schema validation (runs BEFORE hitting the DB)
//   - Easy relation definitions (.relatedQuery, .withGraphFetched)
//   - .query() — a Knex query builder scoped to this table

const { Model } = require('objection');

class User extends Model {
  // Tells Objection which DB table this model maps to
  static get tableName() {
    return 'users';
  }

  // JSON Schema validation — Objection validates incoming data
  // against this schema BEFORE sending it to the DB.
  // Think of it as a last line of defense before the DB.
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'email', 'password_hash'],
      properties: {
        id:            { type: 'integer' },
        name:          { type: 'string', minLength: 1, maxLength: 100 },
        email:         { type: 'string', format: 'email', maxLength: 255 },
        password_hash: { type: 'string', maxLength: 255 },
        created_at:    { type: 'string' },
        updated_at:    { type: 'string' },
      },
    };
  }

  // Columns to NEVER return to the client.
  // Objection calls this automatically after any query —
  // password_hash will never appear in API responses.
  // This is safer than trying to remember to delete it in every controller.
  $formatJson(json) {
    json = super.$formatJson(json);
    delete json.password_hash;
    return json;
  }
}

module.exports = User;
