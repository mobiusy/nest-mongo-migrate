/**
 * description: xxxxxxxxxx
 */

module.exports = {
  /**
   * upgrade script
   * @param {mongo.Db} db 
   * @param {mongo.MongoClient} client 
   */
  async up(db, client) {
    // TODO write your migration here.
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
  },

  /**
   * downgrade script
   * @param {mongo.Db} db 
   * @param {mongo.MongoClient} client 
   */
  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
