# detabase

[Deta Base](https://docs.deta.sh/docs/base/about) CLI with extended functionality written on Node.js

## Use Cases

- Query, get, put, insert, delete, update items.
- Export databases with or without a specific query.
- Print databases in the table or json view.
- Put or insert data from command line or from file.
- Clone databases with or without a specific query.
- Delete or update multiple items with a query.
- Truncate databases.
- Create empty databases.
- Count items in database.

## Usage

```sh
npm install -g @mikhailsdv/detabase
```

After installing it, run `detabase --help` without arguments to see list of options:

```console
Usage: detabase [options] [command]

Options:
  -v, --version                          Output the current version.
  -h, --help                             Read more information.

Commands:
  export [options] <database>            Create a .json dump of a given database. If no query provided, exports the
                                         whole database.
  count [options] <database>             Count items of a given database with or without a query.
  clone [options] <database> <new-name>  Clone database.
  insert [options] <database>            Insert items into existing database. Creates a new item only if no item with
                                         the same key exists.
  put [options] <database>               Put items into existing database. This request overwrites an item if it's key
                                         already exists.
  create <database>                      Creates a database.
  truncate <database>                    Truncates a database.
  query [options] <database>             Show items matching a query.
  delete [options] <database> [key]      Deletes an item with the given key or items matching a query.
  update [options] <database> [key]      Update an item with the given key or items matching a query.
  get <database> <key>                   Get an item with the given key. Use "detabase query <query>" in order to be
                                         able to specify a query.
  auth <project-key>                     Set your project key.
  help [command]                         Display help for command.
```

First thing you need to do is to set your Deta project key by running:

```sh
detabase auth your_project_key
```

From now, you can run any command. Note that this project uses Deta's syntax for querying, so whenever you see `<query>` it expects you to use queries as described [here](https://docs.deta.sh/docs/base/http#query-items).

## Available commands

- [export](#export)
- [insert](#insert)
- [put](#put)
- [delete](#delete)
- [update](#update)
- [query](#query)
- [create](#create)
- [clone](#clone)
- [get](#get)
- [truncate](#truncate)
- [count](#count)

## export

**Syntax:**

```sh
detabase export <database> -q <query> -li <limit> -la <last> -fn <filename>
detabase export <database> --query <query> --limit <limit> --last <last> -filename <filename>
```

**Examples:**

```sh
# Export the whole database `users`
detabase export users

# Export only users whose age equals to 25
detabase export users -q "{age: 25}"

# Export only users whose age is greater than 18
# and save the file in the specific path
detabase export users -q "{'age?gt': 18}" -
```

## insert

**Syntax:**

```sh
detabase insert <database> -i <items> -ff <from-file>
detabase insert <database> --items <items> --from-file <from-file>
```

**Examples:**

```sh
# Insert an item to database `users`
detabase insert users -i "{name: 'Jack', age: 22}"

# Insert two items to database `users`
detabase insert users -i "[{name: 'Jack', age: 22},{name: 'Hanna', age: 25}]"

# Insert data from json file
detabase insert users -ff "./some/path/data_to_insert.json"
```

## put

**Syntax:**

```sh
detabase put <database> -i <items> -ff <from-file>
detabase put <database> --items <items> --from-file <from-file>
```

**Examples:**

```sh
# Insert an item to database `users`
detabase put users -i "{name: 'Jack', age: 22}"

# Insert two items to database `users`
detabase put users -i "[{name: 'Jack', age: 22},{name: 'Hanna', age: 25}]"

# Insert data from json file
detabase put users -ff "./some/path/data_to_insert.json"
```

## delete

**Syntax:**

```sh
detabase delete <database> -q <query>
detabase delete <database> --query <query>
```

**Examples:**

```sh
# Delete an item from `users` with the key "csn9weej2"
detabase delete users csn9weej2

# Delete users with name Jack
detabase delete users -q "{name: 'Jack'}"
```

## update

**Syntax:**

```sh
detabase update <database> -q <query> -s <object> -i <object> -a <object> -p <object> -d <string, array>
detabase update <database> --query <query> --set <object> --increment <object> --append <object> --prepend <object> --delete <string, array>
```

**Examples:**

```sh
# Update an item from `users` with the key "csn9weej2", set name to "Hanna"
detabase update users csn9weej2 --set "{name: 'Hanna'}"

# Update users with age = 18, increment their ages by 1.
detabase update users -q "{age: 18}" --increment "{age: 1}"
```

## query

**Syntax:**

```sh
detabase query <database> -q <query> -li <limit> -la <last> -j
detabase query <database> --query <query> --limit <limit> --last <last> --json
```

**Examples:**

```sh
# Show all items from `users`
detabase query users

# Print a table with users whose age is 18
detabase query users -q "{age: 18}"

# Pring json items of users whose age is 18
detabase query users -q "{age: 18}" -j
```

## create

**Syntax:**

```sh
detabase create <database>
```

**Examples:**

```sh
# Create a database named `new_db`
detabase create new_db
```

## clone

**Syntax:**

```sh
detabase clone <database> <new-name> -q <query> -f
detabase clone <database> <new-name> --query <query> --force
```

**Examples:**

```sh
# Clone `some_db` into `new_db`
detabase clone some_db new_db

# Clone `some_db` into `existing_db` even if database with the given name already exists
detabase clone some_db existing_db --force
```

## get

**Syntax:**

```sh
detabase get <database> <key>
```

**Examples:**

```sh
# Get an item with key "csn9weej2" from `users` database
detabase get users csn9weej2
```

## truncate

**Syntax:**

```sh
detabase truncate <database>
```

**Examples:**

```sh
# Remove all the items from `users` database
detabase truncate users
```

## count

**Syntax:**

```sh
detabase count <database> -q <query>
detabase count <database> --query <query>
```

**Examples:**

```sh
# Count items of `users` database
detabase count users

# Count items of `users` database where name = 'Jack'
detabase count users -q "{name: 'Jack'}"
```
