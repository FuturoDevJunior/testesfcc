#!/bin/bash

DB="number_guess"

# Função para conectar ao banco
PSQL="psql --username=freecodecamp --dbname=$DB --tuples-only -c"

# Função para obter ou criar usuário
get_or_create_user() {
  echo "Enter your username:"
  read USERNAME
  USERNAME=$(echo "$USERNAME" | cut -c1-22 | xargs)
  USER_ID=$($PSQL "SELECT user_id FROM users WHERE username='$USERNAME';" | xargs)
  if [[ -z $USER_ID ]]; then
    $PSQL "INSERT INTO users(username) VALUES('$USERNAME');" > /dev/null
    USER_ID=$($PSQL "SELECT user_id FROM users WHERE username='$USERNAME';" | xargs)
    echo "Welcome, $USERNAME! It looks like this is your first time here."
  else
    GAMES_PLAYED=$($PSQL "SELECT COUNT(*) FROM games WHERE user_id=$USER_ID;" | xargs)
    BEST_GAME=$($PSQL "SELECT MIN(guesses) FROM games WHERE user_id=$USER_ID;" | xargs)
    echo "Welcome back, $USERNAME! You have played $GAMES_PLAYED games, and your best game took $BEST_GAME guesses."
  fi
}

# Função para jogar
play_game() {
  SECRET=$(( RANDOM % 1000 + 1 ))
  echo "Guess the secret number between 1 and 1000:"
  GUESSES=0
  while true; do
    read GUESS
    ((GUESSES++))
    if ! [[ $GUESS =~ ^[0-9]+$ ]]; then
      echo "That is not an integer, guess again:"
      continue
    fi
    if (( GUESS < SECRET )); then
      echo "It's higher than that, guess again:"
    elif (( GUESS > SECRET )); then
      echo "It's lower than that, guess again:"
    else
      echo "You guessed it in $GUESSES tries. The secret number was $SECRET. Nice job!"
      $PSQL "INSERT INTO games(user_id, guesses) VALUES($USER_ID, $GUESSES);" > /dev/null
      break
    fi
  done
}

# Execução principal
get_or_create_user
play_game 