module.exports = {
    dialect: 'postgres',
    host: 'localhost',
    username: 'postgres',
    password: 'docker',
    database: 'goBarberDb',
    port: '5433',
    define: {
        timestamps: true,
        underscored: true, // Sequelize ira criar tabelas no formato user_groups
        underscoredAll: true, // O mesmo para colunas e relacionamenos
    },
};