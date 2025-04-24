-- Table: users
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(22) UNIQUE NOT NULL
);

-- Table: games
CREATE TABLE IF NOT EXISTS games (
  game_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id),
  guesses INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 