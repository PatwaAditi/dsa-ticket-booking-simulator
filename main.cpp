#include <iostream>
#include <queue>
#include <vector>
#include <string>
#include <limits>
#include <ios>

using namespace std;

const int TOTAL_TICKETS = 10;

struct Customer {
    string name;
    int quantity;
};

struct Booking {
    int bookingID;
    string name;
    int quantity;
};

queue<Customer> waitingQueue;
vector<Booking> confirmedBookings;

int availableTickets = TOTAL_TICKETS;
int nextBookingID = 1001;
int totalConfirmed = 0;
int totalCancelled = 0;
int totalTicketsCancelled = 0;

// Safely read an integer
int readInt(const string& prompt) {
    int value;

    while (true) {
        cout << prompt;

        if (cin >> value) {
            cin.ignore(numeric_limits<std::streamsize>::max(), '\n');
            return value;
        }

        cout << "Invalid input. Enter an integer.\n";
        cin.clear();
        cin.ignore(numeric_limits<std::streamsize>::max(), '\n');
    }
}

// Read a non-empty customer name
string readName() {
    string name;

    while (true) {
        cout << "Enter customer name: ";
        getline(cin, name);

        if (name.find_first_not_of(" \t\r\n") != string::npos) {
            return name;
        }

        cout << "Name cannot be empty.\n";
    }
}

// Confirm a booking
void confirmBooking(const Customer& customer) {
    Booking booking;

    booking.bookingID = nextBookingID++;
    booking.name = customer.name;
    booking.quantity = customer.quantity;

    confirmedBookings.push_back(booking);
    availableTickets -= customer.quantity;
    totalConfirmed++;

    cout << "\nBooking confirmed successfully!\n";
    cout << "Booking ID: " << booking.bookingID << '\n';
    cout << "Customer: " << booking.name << '\n';
    cout << "Tickets booked: " << booking.quantity << '\n';
    cout << "Tickets remaining: " << availableTickets << '\n';
}

// Process waiting customers in FIFO order
void processWaitingQueue() {
    if (waitingQueue.empty()) {
        cout << "\nThe waiting queue is empty.\n";
        return;
    }

    cout << "\nProcessing waiting queue...\n";

    while (!waitingQueue.empty()) {
        Customer customer = waitingQueue.front();

        // Do not let later customers bypass the first customer
        if (customer.quantity > availableTickets) {
            cout << "Cannot process " << customer.name
                 << ". Insufficient tickets.\n";
            break;
        }

        waitingQueue.pop();
        confirmBooking(customer);
    }

    if (waitingQueue.empty()) {
        cout << "All waiting requests have been processed.\n";
    } else {
        cout << "Customers still waiting: "
             << waitingQueue.size() << '\n';
    }
}

// Book tickets or join the waiting queue
void bookTickets() {
    Customer customer;

    customer.name = readName();
    customer.quantity = readInt("Enter number of tickets: ");

    if (customer.quantity <= 0) {
        cout << "Ticket quantity must be greater than zero.\n";
        return;
    }

    if (customer.quantity > TOTAL_TICKETS) {
        cout << "Cannot request more than "
             << TOTAL_TICKETS << " tickets.\n";
        return;
    }

    // Preserve FIFO order for existing waiting customers
    if (waitingQueue.empty() &&
        customer.quantity <= availableTickets) {
        confirmBooking(customer);
    } else {
        waitingQueue.push(customer);

        cout << "\nCustomer added to the waiting queue.\n";
        cout << "Queue position: " << waitingQueue.size() << '\n';
    }
}

// Cancel some or all tickets from a booking
void cancelBooking() {
    if (confirmedBookings.empty()) {
        cout << "\nNo confirmed bookings to cancel.\n";
        return;
    }

    int id = readInt("Enter booking ID to cancel: ");

    for (vector<Booking>::iterator it = confirmedBookings.begin();
         it != confirmedBookings.end(); ++it) {

        if (it->bookingID == id) {
            cout << "\nBooking found.\n";
            cout << "Customer: " << it->name << '\n';
            cout << "Booking ID: " << it->bookingID << '\n';
            cout << "Tickets currently booked: "
                 << it->quantity << '\n';

            int quantity = readInt(
                "Enter number of tickets to cancel: "
            );

            if (quantity <= 0) {
                cout << "Cancellation quantity must be positive.\n";
                return;
            }

            if (quantity > it->quantity) {
                cout << "Cannot cancel more tickets than booked.\n";
                return;
            }

            // Release only the requested number of tickets
            availableTickets += quantity;
            totalTicketsCancelled += quantity;
            totalCancelled++;

            string customerName = it->name;
            int remaining = it->quantity - quantity;

            if (remaining == 0) {
                // Entire booking cancelled
                confirmedBookings.erase(it);

                cout << "\nEntire booking cancelled successfully.\n";
            } else {
                // Partial cancellation
                it->quantity = remaining;

                cout << "\nPartial cancellation successful.\n";
            }

            cout << "Customer: " << customerName << '\n';
            cout << "Tickets cancelled: " << quantity << '\n';
            cout << "Tickets remaining in booking: "
                 << remaining << '\n';
            cout << "Available tickets before queue processing: "
                 << availableTickets << '\n';

            // Released tickets may serve waiting customers
            processWaitingQueue();
            return;
        }
    }

    cout << "Booking ID not found.\n";
}

// Display ticket availability
void displayAvailableTickets() {
    cout << "\n--- TICKET AVAILABILITY ---\n";
    cout << "Total ticket capacity: " << TOTAL_TICKETS << '\n';
    cout << "Available tickets: " << availableTickets << '\n';
    cout << "Currently booked tickets: "
         << TOTAL_TICKETS - availableTickets << '\n';
}

// Display confirmed bookings
void displayConfirmedBookings() {
    if (confirmedBookings.empty()) {
        cout << "\nNo confirmed bookings.\n";
        return;
    }

    cout << "\n--- CONFIRMED BOOKINGS ---\n";

    for (size_t i = 0; i < confirmedBookings.size(); i++) {
        cout << "\nBooking ID: "
             << confirmedBookings[i].bookingID << '\n';
        cout << "Customer: "
             << confirmedBookings[i].name << '\n';
        cout << "Tickets: "
             << confirmedBookings[i].quantity << '\n';
    }
}

// Display waiting queue without modifying it
void displayWaitingQueue() {
    if (waitingQueue.empty()) {
        cout << "\nThe waiting queue is empty.\n";
        return;
    }

    queue<Customer> temp = waitingQueue;
    int position = 1;

    cout << "\n--- WAITING QUEUE (FIFO) ---\n";

    while (!temp.empty()) {
        Customer customer = temp.front();
        temp.pop();

        cout << "Position: " << position++ << '\n';
        cout << "Customer: " << customer.name << '\n';
        cout << "Tickets requested: "
             << customer.quantity << "\n\n";
    }
}

// Display booking statistics
void displayStatistics() {
    cout << "\n--- BOOKING STATISTICS ---\n";
    cout << "Total successful bookings: "
         << totalConfirmed << '\n';
    cout << "Cancellation operations: "
         << totalCancelled << '\n';
    cout << "Total tickets cancelled: "
         << totalTicketsCancelled << '\n';
    cout << "Current confirmed bookings: "
         << confirmedBookings.size() << '\n';
    cout << "Customers waiting: "
         << waitingQueue.size() << '\n';
    cout << "Currently booked tickets: "
         << TOTAL_TICKETS - availableTickets << '\n';
    cout << "Available tickets: "
         << availableTickets << '\n';
}

// Main menu
int main() {
    int choice;

    cout << "=====================================\n";
    cout << "   ONLINE TICKET BOOKING SIMULATOR\n";
    cout << "=====================================\n";

    do {
        cout << "\n1. Book Tickets\n";
        cout << "2. Process Waiting Queue\n";
        cout << "3. Cancel Booking / Partial Cancellation\n";
        cout << "4. Display Available Tickets\n";
        cout << "5. Display Confirmed Bookings\n";
        cout << "6. Display Waiting Queue\n";
        cout << "7. Display Booking Statistics\n";
        cout << "8. Exit\n";

        choice = readInt("\nEnter your choice: ");

        switch (choice) {
            case 1:
                bookTickets();
                break;

            case 2:
                processWaitingQueue();
                break;

            case 3:
                cancelBooking();
                break;

            case 4:
                displayAvailableTickets();
                break;

            case 5:
                displayConfirmedBookings();
                break;

            case 6:
                displayWaitingQueue();
                break;

            case 7:
                displayStatistics();
                break;

            case 8:
                cout << "\nThank you for using the simulator.\n";
                break;

            default:
                cout << "Invalid choice. Select 1 to 8.\n";
        }

    } while (choice != 8);

    return 0;
}
