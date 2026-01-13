import sqlite3

def check_schema():
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(clients)")
    columns = cursor.fetchall()
    print("Table 'clients' columns:")
    for col in columns:
        print(col)
    conn.close()

if __name__ == "__main__":
    check_schema()
