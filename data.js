/* ══════════════════════════════════════════════════════════════
   DATA.JS — Mumbai Suburban Railway Station & Fare Data
   Real station names, distance-based fare slabs, Indian names
   ══════════════════════════════════════════════════════════════ */

const RAILWAY_DATA = {

    /* ─── STATION LISTS ─── */
    stations: {
        western: [
            'Churchgate', 'Marine Lines', 'Charni Road', 'Grant Road',
            'Mumbai Central', 'Mahalakshmi', 'Lower Parel', 'Prabhadevi',
            'Dadar', 'Matunga Road', 'Mahim Jn', 'Bandra',
            'Khar Road', 'Santacruz', 'Vile Parle', 'Andheri',
            'Jogeshwari', 'Ram Mandir', 'Goregaon', 'Malad',
            'Kandivali', 'Borivali', 'Dahisar', 'Mira Road',
            'Bhayandar', 'Naigaon', 'Vasai Road', 'Nalla Sopara', 'Virar'
        ],
        central: [
            'CSMT', 'Masjid', 'Sandhurst Road', 'Byculla',
            'Chinchpokli', 'Currey Road', 'Parel', 'Dadar',
            'Matunga', 'Sion', 'Kurla', 'Vidyavihar',
            'Ghatkopar', 'Vikhroli', 'Kanjurmarg', 'Bhandup',
            'Nahur', 'Mulund', 'Thane', 'Kalwa',
            'Mumbra', 'Diva', 'Kopar', 'Dombivli',
            'Thakurli', 'Kalyan'
        ],
        harbour: [
            'CSMT', 'Masjid', 'Sandhurst Road', 'Dockyard Road',
            'Reay Road', 'Cotton Green', 'Sewri', 'Vadala Road',
            'King Circle', 'Mahim Jn', 'Guru Tegh Bahadur Nagar',
            'Chunabhatti', 'Kurla', 'Tilak Nagar', 'Chembur',
            'Govandi', 'Mankhurd', 'Vashi', 'Sanpada',
            'Juinagar', 'Nerul', 'Seawoods-Darave', 'Belapur',
            'Kharghar', 'Mansarovar', 'Khandeshwar', 'Panvel'
        ]
    },

    /* ─── DISTANCE (km) — approximate index-based distance from first station ─── */
    /* Each station index * multiplier gives rough km from origin */
    distanceMultiplier: {
        western: 2.1,   // ~60 km Churchgate-Virar over 29 stations
        central: 2.3,   // ~60 km CSMT-Kalyan over 26 stations
        harbour: 2.0    // ~52 km CSMT-Panvel over 27 stations
    },

    /* ─── FARE SLABS (distance in km → fare in ₹) ─── */
    fareSlabs: {
        second: [
            { maxKm: 3, fare: 5 },
            { maxKm: 5, fare: 5 },
            { maxKm: 10, fare: 10 },
            { maxKm: 15, fare: 15 },
            { maxKm: 20, fare: 20 },
            { maxKm: 30, fare: 25 },
            { maxKm: 40, fare: 30 },
            { maxKm: 50, fare: 35 },
            { maxKm: 999, fare: 40 }
        ],
        first: [
            { maxKm: 3, fare: 50 },
            { maxKm: 5, fare: 65 },
            { maxKm: 10, fare: 85 },
            { maxKm: 15, fare: 105 },
            { maxKm: 20, fare: 130 },
            { maxKm: 30, fare: 155 },
            { maxKm: 40, fare: 180 },
            { maxKm: 50, fare: 200 },
            { maxKm: 999, fare: 215 }
        ],
        ac: [
            { maxKm: 3, fare: 65 },
            { maxKm: 5, fare: 80 },
            { maxKm: 10, fare: 105 },
            { maxKm: 15, fare: 130 },
            { maxKm: 20, fare: 160 },
            { maxKm: 30, fare: 195 },
            { maxKm: 40, fare: 220 },
            { maxKm: 50, fare: 250 },
            { maxKm: 999, fare: 275 }
        ]
    },

    /* multiplier for ticket types */
    typeMultiplier: {
        single: 1,
        return: 2,        // double the single fare
        pass: 15         // monthly pass ≈ 15x single (discounted from 60 trips)
    },

    /* ─── RANDOM INDIAN NAMES ─── */
    firstNames: [
        'Aarav', 'Aditi', 'Amit', 'Ananya', 'Arjun', 'Bhavna', 'Chirag',
        'Deepa', 'Devika', 'Farhan', 'Gauri', 'Harsh', 'Isha', 'Jatin',
        'Kavya', 'Lakshmi', 'Manish', 'Neha', 'Omkar', 'Pallavi',
        'Pranav', 'Priya', 'Rahul', 'Riya', 'Rohit', 'Sakshi', 'Sanjay',
        'Shruti', 'Sneha', 'Suresh', 'Tanvi', 'Uday', 'Vandana', 'Vikas',
        'Yash', 'Zara', 'Aditya', 'Meera', 'Nikhil', 'Pooja', 'Rajesh',
        'Simran', 'Tushar', 'Varun', 'Anita', 'Dinesh', 'Komal', 'Manoj',
        'Nandini', 'Reema', 'Siddharth', 'Vivek', 'Akash', 'Divya'
    ],
    lastNames: [
        'Sharma', 'Patel', 'Verma', 'Iyer', 'Deshmukh', 'Kulkarni',
        'Joshi', 'Naik', 'Patil', 'Shah', 'Mehta', 'Gupta', 'Singh',
        'Reddy', 'Nair', 'Menon', 'Rao', 'Pillai', 'Bhat', 'Deshpande',
        'Sawant', 'Pawar', 'Jadhav', 'More', 'Ghosh', 'Mukherjee',
        'Bhatt', 'Chauhan', 'Kapoor', 'Malhotra', 'Shetty', 'Fernandes',
        'DSouza', 'Khan', 'Shaikh', 'Ansari', 'Thakur', 'Tiwari'
    ],

    /* ─── TRAIN DESTINATIONS (for platform display) ─── */
    trainDestinations: {
        up: [   // southbound
            'Churchgate', 'CSMT', 'Panvel', 'Churchgate',
            'CSMT', 'Andheri', 'Borivali', 'CSMT'
        ],
        down: [  // northbound
            'Virar', 'Kalyan', 'Panvel', 'Borivali',
            'Thane', 'Dombivli', 'Vasai Road', 'Virar'
        ]
    }
};
