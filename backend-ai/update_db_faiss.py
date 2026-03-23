from update_db_fiass import add_more_data_to_db
import sys


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python update_db_faiss.py <세그먼트번호>")
        print("  예: python update_db_faiss.py 1  → 0~10,000건")
        print("      python update_db_faiss.py 2  → 10,000~20,000건")
        sys.exit(1)
    try:
        segment = int(sys.argv[1])
    except ValueError:
        print("숫자를 입력하세요.")
        sys.exit(1)
    if segment < 1:
        print("1 이상 입력하세요.")
        sys.exit(1)
    add_more_data_to_db(segment)
