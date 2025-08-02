// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { sql } = require('@vercel/postgres');

// Static data extracted from current index.html
const boldPlayers = [
  "Jayden Daniels", "Patrick Mahomes", "Brock Bowers", "Trey McBride", "T.J. Hockenson", 
  "David Njoku", "Tucker Kraft", "Tyler Warren", "Dallas Goedert", "Harold Fannin", 
  "Zach Ertz", "Ja'Tavion Sanders", "Jahmyr Gibbs", "De'Von Achane", "Ashton Jeanty", 
  "Kenneth Walker", "Omarion Hampton", "TreVeyon Henderson", "RJ Harvey", "Cam Skattebo", 
  "Jordan Mason", "Jaylen Warren", "JK Dobbins", "Tyjae Spears", "Dylan Sampson", 
  "Zach Charbonnet", "Bhayshul Tuten", "Jaydon Blue", "Isaac Guerendo", "Brashard Smith", 
  "Jarquez Hunter", "Roschon Johnson", "DJ Giddens", "Tahj Brooks", "Jacory Croskey-Merritt", 
  "Trevor Etienne", "Woody Marks", "Kyle Monangai", "Ja'Marr Chase", "CeeDee Lamb", 
  "Malik Nabers", "Puka Nacua", "Nico Collins", "Brian Thomas", "Drake London", 
  "Ladd McConkey", "Tyreek Hill", "Xavier Worthy", "Tetairoa McMillan", "Rashee Rice", 
  "George Pickens", "Jameson Williams", "Jerry Jeudy", "Chris Olave", "Jordan Addison", 
  "Jayden Reed", "Emeka Egbuka", "Josh Downs", "Michael Pittman", "Jayden Higgins", 
  "Matthew Golden", "Luther Burden", "Kyle Williams", "Wan'Dale Robinson", "Jalen Coker", 
  "Jalen Royals", "Malik Washington", "Jaylin Lane", "Elic Ayomanor", "KeAndre Lambert-Smith", 
  "Diontae Johnson", "Keenan Allen"
];

const italicPlayers = [
  "Baker Mayfield", "Travis Kelce", "Evan Engram", "Isaiah Likely", "Theo Johnson", 
  "Alvin Kamara", "Isiah Pacheco", "Brian Robinson", "Travis Etienne", "Tyrone Tracy", 
  "Javonte Williams", "Quinshon Judkins", "Mike Evans", "D.J. Moore", "DK Metcalf", 
  "Courtland Sutton", "Jakobi Meyers", "Cooper Kupp", "Darnell Mooney", "Rashid Shaheed", 
  "Marvin Mims", "Xavier Legette", "Quentin Johnston", "Josh Palmer", "Jack Bech", 
  "Adam Thielen"
];

const positions = {
  quarterbacks: [
    "Lamar Jackson", "Jayden Daniels", "Josh Allen", "Jalen Hurts", "Joe Burrow", "Patrick Mahomes", "Bo Nix", "Kyler Murray", "Baker Mayfield", "Justin Fields", "Brock Purdy", "Dak Prescott", "Caleb Williams", "Drake Maye", "J.J. McCarthy", "Trevor Lawrence", "Justin Herbert", "Jordan Love", "C.J. Stroud", "Jared Goff", "Bryce Young", "Tua Tagovailoa", "Michael Penix", "Anthony Richardson", "Cam Ward", "Geno Smith", "Matthew Stafford", "Aaron Rodgers", "Jaxson Dart", "Daniel Jones", "Sam Darnold", "Tyler Shough", "Russell Wilson", "Joe Flacco", "Jalen Milroe", "Dillon Gabriel", "Shedeur Sanders"
  ],
  runningbacks: [
    "Jahmyr Gibbs", "Bijan Robinson", "De'Von Achane", "Saquon Barkley", "Christian McCaffrey", "Ashton Jeanty", "Derrick Henry", "Bucky Irving", "Jonathan Taylor", "Kenneth Walker", "Chase Brown", "Omarion Hampton", "Josh Jacobs", "James Cook", "Breece Hall", "Kyren Williams", "TreVeyon Henderson", "RJ Harvey", "James Conner", "Chuba Hubbard", "Alvin Kamara", "David Montgomery", "D'Andre Swift", "Kaleb Johnson", "Cam Skattebo", "Aaron Jones", "Jordan Mason", "Jaylen Warren", "Tony Pollard", "JK Dobbins", "Tyjae Spears", "Isiah Pacheco", "Dylan Sampson", "Brian Robinson", "Travis Etienne", "Tyrone Tracy", "Zach Charbonnet", "Bhayshul Tuten", "Jaydon Blue", "Isaac Guerendo", "Jerome Ford", "Rhamondre Stevenson", "Tyler Allgeier", "Ray Davis", "Trey Benson", "Joe Mixon", "Brashard Smith", "Jarquez Hunter", "Tank Bigsby", "Najee Harris", "Javonte Williams", "Roschon Johnson", "Nick Chubb", "Rachaad White", "Austin Ekeler", "Quinshon Judkins", "Will Shipley", "Jaylen Wright", "DJ Giddens", "Tahj Brooks", "Jacory Croskey-Merritt", "Trevor Etienne", "Woody Marks", "Braelon Allen", "Kyle Monangai", "Keaton Mitchell", "Rico Dowdle", "Elijah Mitchell", "Devin Neal", "Ollie Gordon", "Sean Tucker", "Justice Hill", "Emanuel Wilson", "Miles Sanders", "Kendre Miller", "Ty Johnson", "MarShawn Lloyd", "Isaiah Davis", "Dameon Pierce", "Audric Estime", "Phil Mafah", "Kimani Vidal", "Kalel Mullings", "Antonio Gibson", "Samaje Perine", "Raheem Mostert", "Sincere McCormick", "AJ Dillon", "Blake Corum", "Jordan James", "Kareem Hunt", "Devin Singletary", "Alexander Mattison"
  ],
  widereceivers: [
    "Ja'Marr Chase", "CeeDee Lamb", "Malik Nabers", "Justin Jefferson", "Puka Nacua", "Nico Collins", "Brian Thomas", "Amon-Ra St. Brown", "Drake London", "Ladd McConkey", "Tyreek Hill", "A.J. Brown", "Davante Adams", "Jaxon Smith-Njigba", "Garrett Wilson", "Marvin Harrison", "Tee Higgins", "Xavier Worthy", "Tetairoa McMillan", "Rashee Rice", "George Pickens", "Jameson Williams", "Terry McLaurin", "Travis Hunter", "Mike Evans", "Zay Flowers", "Jaylen Waddle", "Jerry Jeudy", "Chris Olave", "DeVonta Smith", "Rome Odunze", "Jordan Addison", "D.J. Moore", "Jayden Reed", "Calvin Ridley", "DK Metcalf", "Courtland Sutton", "Jauan Jennings", "Khalil Shakir", "Stefon Diggs", "Emeka Egbuka", "Chris Godwin", "Josh Downs", "Brandon Aiyuk", "Ricky Pearsall", "Deebo Samuel", "Michael Pittman", "Jayden Higgins", "Matthew Golden", "Jakobi Meyers", "Luther Burden", "Tre Harris", "Cooper Kupp", "Darnell Mooney", "Kyle Williams", "Keon Coleman", "Marquise Brown", "Christian Kirk", "Wan'Dale Robinson", "Rashod Bateman", "Romeo Doubs", "Pat Bryant", "Rashid Shaheed", "Jalen Coker", "Jalen Royals", "Jaylin Noel", "Marvin Mims", "Troy Franklin", "Jalen McMillan", "Malik Washington", "Jaylin Lane", "Elic Ayomanor", "Dont'e Thornton", "Cedric Tillman", "KeAndre Lambert-Smith", "Jordan Whittington", "Diontae Johnson", "Xavier Legette", "Keenan Allen", "DeMario Douglas", "Dyami Brown", "Quentin Johnston", "Josh Reyolds", "Dontayvion Wicks", "Josh Palmer", "Tyler Lockett", "Alec Pierce", "Michael Wilson", "Darius Slayton", "Jack Bech", "Adam Thielen", "Calvin Austin", "Savion Williams", "Ray-Ray McCloud"
  ],
  tightends: [
    "Brock Bowers", "Trey McBride", "George Kittle", "Sam LaPorta", "T.J. Hockenson", "David Njoku", "Tucker Kraft", "Travis Kelce", "Mark Andrews", "Tyler Warren", "Colston Loveland", "Evan Engram", "Dallas Goedert", "Dalton Kincaid", "Jake Ferguson", "Kyle Pitts", "Brenton Strange", "Harold Fannin", "Zach Ertz", "Ja'Tavion Sanders", "Mike Gesicki", "Chig Okonkwo", "Hunter Henry", "Jonnu Smith", "Pat Freiermuth", "Cade Otton", "Isaiah Likely", "Dalton Schultz", "Tyler Higbee", "Terrance Ferguson", "Juwan Johnson", "Elijah Arroyo", "Darren Waller", "Tyler Conklin", "Mason Taylor", "Noah Fant", "Theo Johnson", "Cade Stover", "Will Dissly", "Orande Gadsden", "Cole Kmet", "Austin Hooper", "Gunnar Helm", "Michael Mayer", "AJ Barner", "Grant Calcaterra"
  ]
};

const tierBreaks = {
  quarterbacks: {
    "Jayden Daniels": "small",
    "Jalen Hurts": "big",
    "Patrick Mahomes": "big",
    "Baker Mayfield": "small",
    "Jared Goff": "small",
    "Matthew Stafford": "small"
  },
  runningbacks: {
    "Bijan Robinson": "small",
    "Ashton Jeanty": "big",
    "Kenneth Walker": "small",
    "James Conner": "big",
    "Tyjae Spears": "small",
    "Quinshon Judkins": "small",
    "Elijah Mitchell": "small",
    "Miles Sanders": "small"
  },
  widereceivers: {
    "Justin Jefferson": "small",
    "A.J. Brown": "small",
    "Drake London": "big",
    "Travis Hunter": "small",
    "Courtland Sutton": "small",
    "Tre Harris": "big",
    "Dyami Brown": "small"
  },
  tightends: {
    "Brock Bowers": "small",
    "Trey McBride": "big",
    "George Kittle": "small",
    "T.J. Hockenson": "big",
    "Dalton Kincaid": "small",
    "Chig Okonkwo": "small"
  }
};

// Default team assignments (to be updated later via edit interface)
const defaultTeam = 'TBD'; // Placeholder - we'll allow this temporarily
const defaultByeWeek = null; // Will be updated when teams are assigned

async function migrate() {
  try {
    console.log('Starting migration...');

    // Create initial version
    console.log('Creating initial version...');
    const versionResult = await sql`
      INSERT INTO ranking_versions (version_number, is_current, notes)
      VALUES (1, true, 'Initial migration from static data - v1 - 8/2/25')
      RETURNING id
    `;
    
    const versionId = versionResult.rows[0].id;
    console.log(`Created version ${versionId}`);

    // Position mapping
    const positionMap = {
      'quarterbacks': 'QB',
      'runningbacks': 'RB', 
      'widereceivers': 'WR',
      'tightends': 'TE'
    };

    // Process each position
    for (const [positionKey, playerList] of Object.entries(positions)) {
      const position = positionMap[positionKey];
      console.log(`Processing ${position} players...`);

      for (let i = 0; i < playerList.length; i++) {
        const playerName = playerList[i];
        const positionRank = i + 1;
        const isBold = boldPlayers.includes(playerName);
        const isItalic = italicPlayers.includes(playerName);
        
        // Check for tier breaks after this player
        const positionTierBreaks = tierBreaks[positionKey] || {};
        const hasSmallTierBreak = positionTierBreaks[playerName] === 'small';
        const hasBigTierBreak = positionTierBreaks[playerName] === 'big';

        await sql`
          INSERT INTO players (
            version_id, name, position, position_rank, nfl_team, bye_week,
            is_bold, is_italic, small_tier_break, big_tier_break,
            news_copy, ranking_change
          ) VALUES (
            ${versionId}, ${playerName}, ${position}, ${positionRank}, ${defaultTeam}, ${defaultByeWeek},
            ${isBold}, ${isItalic}, ${hasSmallTierBreak}, ${hasBigTierBreak},
            null, 0
          )
        `;
      }
    }

    console.log('Migration completed successfully!');
    console.log(`Created version 1 with ${Object.values(positions).flat().length} players`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate().then(() => {
    console.log('Migration finished');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
}

module.exports = { migrate };