import os
import time
from dotenv import load_dotenv
from jello_backend import JelloBackend

load_dotenv()


def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")


def get_api_key():
    api_key = os.environ.get("YOUTUBE_API_KEY")
    return api_key


def print_header():
    print("=" * 40)
    print("       J E L L O   P L A Y E R       ")
    print("=" * 40)


def main():
    clear_screen()
    print_header()

    api_key = get_api_key()

    backend = JelloBackend(api_key)
    channels = backend.get_channels()

    while True:
        clear_screen()
        print_header()
        print("\nAvailable Channels:")
        channel_names = list(channels.keys())
        for i, name in enumerate(channel_names):
            print(f"{i + 1}. {name}")
        print("Q. Quit")

        choice = input("\nSelect a channel (1-7) or Q to quit: ").strip().lower()

        if choice == "q":
            break

        try:
            idx = int(choice) - 1
            if 0 <= idx < len(channel_names):
                selected_channel = channel_names[idx]
                channel_id = channels[selected_channel]

                print(f"\nFetching uploads for {selected_channel}...")
                songs = backend.get_uploads(channel_id)

                if not songs:
                    print("No songs found or error fetching songs.")
                    time.sleep(2)
                    continue

                while True:
                    clear_screen()
                    print_header()
                    print(f"\nChannel: {selected_channel}")
                    print("-" * 30)
                    for i, song in enumerate(songs):
                        print(f"{i + 1}. {song['title']}")
                    print("B. Back to Channels")

                    song_choice = (
                        input("\nSelect a song to play or B to back: ").strip().lower()
                    )

                    if song_choice == "b":
                        break

                    try:
                        s_idx = int(song_choice) - 1
                        if 0 <= s_idx < len(songs):
                            song = songs[s_idx]
                            print(f"\nStarting playback for: {song['title']}...")
                            print("Press Ctrl+C to stop playback\n")

                            video_url = backend.get_video_url(song["video_id"])
                            os.system(f'yt-dlp -f bestaudio -o - "{video_url}" | ffplay -nodisp -autoexit -')
                        else:
                            print("Invalid selection.")
                            time.sleep(1)
                    except ValueError:
                        print("Invalid input.")
                        time.sleep(1)
            else:
                print("Invalid selection.")
                time.sleep(1)
        except ValueError:
            print("Invalid input.")
            time.sleep(1)

    print("\nGoodbye!")


if __name__ == "__main__":
    main()
