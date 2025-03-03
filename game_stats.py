from typing import Dict, List, Tuple, Optional, Set, Any
from collections import defaultdict, Counter
import math
import re
import statistics
import json
import os
from datetime import datetime
from dataclasses import dataclass, asdict
import pandas as pd
from board import Board, Move, Direction

class Player:
    """Tracks statistics for an individual player."""
    
    def __init__(self, name: str):
        self.name = name
        self.score_history = []
        self.highest_scoring_move = (0, "")  # (score, word)
        self.bingo_count = 0
        self.special_moves = {
            "nonuple_word": [],  # Words hitting multiple triple word scores
            "quadruple_word": [], # Words hitting multiple double word scores
            "legendre_moves": []  # High value letters on letter multiplier + word multiplier
        }
        self.personal_records = {
            "highest_scoring_word": (0, ""),  # (score, word)
            "best_game_score": 0,
            "current_winning_streak": 0,
            "longest_winning_streak": 0,
            "most_bingos_in_game": 0
        }
        self.move_value_distribution = []  # List of all move scores
    
    def add_move(self, word: str, score: int, is_bingo: bool = False, 
                 special_move_type: Optional[str] = None):
        """Record data for a single move."""
        # Track move score
        self.move_value_distribution.append(score)
        
        # Check if it's the highest scoring move
        if score > self.highest_scoring_move[0]:
            self.highest_scoring_move = (score, word)
            
        # Update highest scoring word record
        if score > self.personal_records["highest_scoring_word"][0]:
            self.personal_records["highest_scoring_word"] = (score, word)
            
        # Track bingos
        if is_bingo:
            self.bingo_count += 1
            
        # Track special moves
        if special_move_type:
            if special_move_type in self.special_moves:
                self.special_moves[special_move_type].append((word, score))
    
    def update_game_result(self, final_score: int, won: bool):
        """Update player statistics after a game."""
        self.score_history.append(final_score)
        
        # Update best game score
        if final_score > self.personal_records["best_game_score"]:
            self.personal_records["best_game_score"] = final_score
            
        # Update winning streak
        if won:
            self.personal_records["current_winning_streak"] += 1
            if self.personal_records["current_winning_streak"] > self.personal_records["longest_winning_streak"]:
                self.personal_records["longest_winning_streak"] = self.personal_records["current_winning_streak"]
        else:
            self.personal_records["current_winning_streak"] = 0
    
    def get_score_classification(self) -> str:
        """Classify the player's scoring based on historical data."""
        if not self.score_history:
            return "Unclassified"
        
        average_score = sum(self.score_history) / len(self.score_history)
        
        if len(self.score_history) < 5:
            # Not enough data for percentiles
            if average_score < 150:
                return "Beginner"
            elif average_score < 250:
                return "Novice"
            elif average_score < 350:
                return "Intermediate"
            elif average_score < 450:
                return "Advanced"
            else:
                return "Expert"
        
        # With enough data, use quantiles for classification
        sorted_scores = sorted(self.score_history)
        quantiles = [
            sorted_scores[int(len(sorted_scores) * 0.25)],
            sorted_scores[int(len(sorted_scores) * 0.5)],
            sorted_scores[int(len(sorted_scores) * 0.75)],
            sorted_scores[int(len(sorted_scores) * 0.9)]
        ]
        
        latest_score = self.score_history[-1]
        
        if latest_score < quantiles[0]:
            return "Beginner"
        elif latest_score < quantiles[1]:
            return "Novice"
        elif latest_score < quantiles[2]:
            return "Intermediate"  
        elif latest_score < quantiles[3]:
            return "Advanced"
        else:
            return "Expert"
    
    def get_move_distribution_stats(self) -> Dict:
        """Calculate stats about the player's move value distribution."""
        if not self.move_value_distribution:
            return {"modal_class": "Unknown", "avg_move_score": 0}
        
        # Calculate modal class using Sturges' rule
        n = len(self.move_value_distribution)
        k = int(1 + 3.322 * math.log10(n))  # Number of classes
        min_val = min(self.move_value_distribution)
        max_val = max(self.move_value_distribution)
        
        if min_val == max_val:
            return {
                "modal_class": f"{min_val}",
                "avg_move_score": min_val
            }
        
        class_width = (max_val - min_val) / k
        
        # Create classes
        classes = []
        for i in range(k):
            lower = min_val + i * class_width
            upper = lower + class_width
            classes.append((lower, upper, 0))  # (lower, upper, count)
        
        # Count values in each class
        for val in self.move_value_distribution:
            for i, (lower, upper, _) in enumerate(classes):
                if lower <= val < upper or (i == k-1 and val == upper):
                    classes[i] = (lower, upper, classes[i][2] + 1)
                    break
        
        # Find modal class
        modal_class_idx = max(range(len(classes)), key=lambda i: classes[i][2])
        modal_class = classes[modal_class_idx]
        
        return {
            "modal_class": f"{modal_class[0]:.1f}-{modal_class[1]:.1f}",
            "avg_move_score": sum(self.move_value_distribution) / len(self.move_value_distribution)
        }
        
    def get_summary(self) -> Dict:
        """Return a summary of player statistics."""
        return {
            "name": self.name,
            "games_played": len(self.score_history),
            "avg_score": sum(self.score_history) / len(self.score_history) if self.score_history else 0,
            "highest_score": max(self.score_history) if self.score_history else 0,
            "classification": self.get_score_classification(),
            "highest_scoring_move": self.highest_scoring_move,
            "bingo_count": self.bingo_count,
            "special_moves": {k: len(v) for k, v in self.special_moves.items()},
            "personal_records": self.personal_records,
            "move_distribution": self.get_move_distribution_stats()
        }


class Match:
    """Represents a match between two players."""
    
    def __init__(self, player1: Player, player2: Player):
        self.player1 = player1
        self.player2 = player2
        self.score_progression = {
            player1.name: [],
            player2.name: []
        }
        self.current_leader = None
        self.lead_changes = []  # List of (move_number, new_leader, lead_size)
        self.is_complete = False
        self.move_count = 0
        self.final_scores = {player1.name: 0, player2.name: 0}
    
    def record_move(self, player_name: str, move_score: int):
        """Record a move and update the score progression."""
        self.move_count += 1
        
        # Initialize scores for the first move
        if not self.score_progression[player_name]:
            self.score_progression[player_name] = [0]
            
        # Update score for the current player
        current_score = self.score_progression[player_name][-1] + move_score
        self.score_progression[player_name].append(current_score)
        
        # Update for the other player (maintain same array length)
        other_player = self.player2.name if player_name == self.player1.name else self.player1.name
        if len(self.score_progression[other_player]) < len(self.score_progression[player_name]):
            self.score_progression[other_player].append(self.score_progression[other_player][-1] if self.score_progression[other_player] else 0)
        
        # Check for lead change
        p1_score = self.score_progression[self.player1.name][-1]
        p2_score = self.score_progression[self.player2.name][-1]
        
        new_leader = None
        if p1_score > p2_score:
            new_leader = self.player1.name
        elif p2_score > p1_score:
            new_leader = self.player2.name
        # If equal, no leader
            
        if new_leader != self.current_leader and new_leader is not None:
            lead_size = abs(p1_score - p2_score)
            self.lead_changes.append((self.move_count, new_leader, lead_size))
            self.current_leader = new_leader
    
    def complete_match(self, p1_final_score: int, p2_final_score: int):
        """Mark the match as complete and record final scores."""
        self.is_complete = True
        self.final_scores = {
            self.player1.name: p1_final_score,
            self.player2.name: p2_final_score
        }
        
        # Update player statistics
        p1_won = p1_final_score > p2_final_score
        self.player1.update_game_result(p1_final_score, p1_won)
        self.player2.update_game_result(p2_final_score, not p1_won)
    
    def get_winner(self) -> Optional[Player]:
        """Return the winning player or None if tied."""
        if not self.is_complete:
            return None
            
        if self.final_scores[self.player1.name] > self.final_scores[self.player2.name]:
            return self.player1
        elif self.final_scores[self.player2.name] > self.final_scores[self.player1.name]:
            return self.player2
        else:
            return None  # Tie
    
    def get_lead_progression_stats(self) -> Dict:
        """Analyze lead progression throughout the match."""
        if not self.is_complete:
            return {"error": "Match not complete"}
            
        total_moves = self.move_count
        early_game = total_moves // 3
        mid_game = early_game * 2
        
        lead_changes_by_phase = {
            "early_game": 0,
            "mid_game": 0,
            "late_game": 0
        }
        
        for move_num, _, _ in self.lead_changes:
            if move_num <= early_game:
                lead_changes_by_phase["early_game"] += 1
            elif move_num <= mid_game:
                lead_changes_by_phase["mid_game"] += 1
            else:
                lead_changes_by_phase["late_game"] += 1
        
        # Calculate competitiveness metrics
        competitiveness = len(self.lead_changes) / total_moves if total_moves > 0 else 0
        
        # Calculate score differences over time
        score_diffs = []
        for i in range(max(len(self.score_progression[self.player1.name]), 
                           len(self.score_progression[self.player2.name]))):
            p1_score = self.score_progression[self.player1.name][i] if i < len(self.score_progression[self.player1.name]) else 0
            p2_score = self.score_progression[self.player2.name][i] if i < len(self.score_progression[self.player2.name]) else 0
            score_diffs.append(abs(p1_score - p2_score))
        
        avg_score_diff = sum(score_diffs) / len(score_diffs) if score_diffs else 0
        
        # Calculate tension index (lower means more tense)
        tension_index = avg_score_diff / max(max(self.final_scores.values()), 1)
        
        return {
            "total_lead_changes": len(self.lead_changes),
            "lead_changes_by_phase": lead_changes_by_phase,
            "competitiveness_index": competitiveness,
            "average_score_difference": avg_score_diff,
            "tension_index": tension_index,
            "pivotal_moments": self._identify_pivotal_moments()
        }
    
    def _identify_pivotal_moments(self) -> List[Dict]:
        """Identify pivotal moments in the match."""
        pivotal_moments = []
        
        # Look for significant lead changes
        for i, (move_num, new_leader, lead_size) in enumerate(self.lead_changes):
            if lead_size > 30:  # Significant lead change
                pivotal_moments.append({
                    "type": "significant_lead_change",
                    "move_number": move_num,
                    "new_leader": new_leader,
                    "lead_size": lead_size
                })
        
        return pivotal_moments
        
    def get_match_summary(self) -> Dict:
        """Return a summary of the match statistics."""
        if not self.is_complete:
            return {"error": "Match not complete"}
            
        winner = self.get_winner()
        winner_name = winner.name if winner else "Tie"
        
        return {
            "players": [self.player1.name, self.player2.name],
            "final_scores": self.final_scores,
            "winner": winner_name,
            "margin": abs(self.final_scores[self.player1.name] - self.final_scores[self.player2.name]),
            "lead_progression": self.get_lead_progression_stats(),
            "total_moves": self.move_count
        }


class League:
    """Manages a league of Scrabble players and tracks statistics across rounds."""
    
    def __init__(self, name: str):
        self.name = name
        self.players = {}  # name -> Player
        self.matches = []  # List of Match objects
        self.rounds = []  # List of lists of matches
    
    def add_player(self, name: str) -> Player:
        """Add a player to the league."""
        if name not in self.players:
            self.players[name] = Player(name)
        return self.players[name]
    
    def get_player(self, name: str) -> Optional[Player]:
        """Get a player by name."""
        return self.players.get(name)
    
    def create_match(self, player1_name: str, player2_name: str) -> Match:
        """Create a match between two players."""
        player1 = self.get_player(player1_name) or self.add_player(player1_name)
        player2 = self.get_player(player2_name) or self.add_player(player2_name)
        
        match = Match(player1, player2)
        self.matches.append(match)
        return match
    
    def start_new_round(self):
        """Start a new round in the league."""
        self.rounds.append([])
    
    def add_match_to_current_round(self, match: Match):
        """Add a match to the current round."""
        if not self.rounds:
            self.start_new_round()
        self.rounds[-1].append(match)
    
    def get_league_statistics(self) -> Dict:
        """Calculate statistics across the entire league."""
        if not self.players:
            return {"error": "No players in the league"}
            
        player_stats = {name: player.get_summary() for name, player in self.players.items()}
        
        # Calculate league-wide statistics
        avg_scores = [stats["avg_score"] for stats in player_stats.values()]
        avg_league_score = sum(avg_scores) / len(avg_scores) if avg_scores else 0
        
        highest_individual_score = max((stats["highest_score"] for stats in player_stats.values()), default=0)
        
        # Track players by classification
        players_by_class = defaultdict(list)
        for name, stats in player_stats.items():
            players_by_class[stats["classification"]].append(name)
        
        return {
            "name": self.name,
            "player_count": len(self.players),
            "match_count": len(self.matches),
            "round_count": len(self.rounds),
            "avg_league_score": avg_league_score,
            "highest_individual_score": highest_individual_score,
            "players_by_classification": dict(players_by_class),
            "player_stats": player_stats
        }
    
    def get_round_statistics(self, round_idx: int) -> Dict:
        """Calculate statistics for a specific round."""
        if round_idx < 0 or round_idx >= len(self.rounds):
            return {"error": f"Round {round_idx} does not exist"}
            
        round_matches = self.rounds[round_idx]
        if not round_matches:
            return {"error": f"Round {round_idx} has no matches"}
        
        winners = []
        winner_scores = []
        
        for match in round_matches:
            if not match.is_complete:
                continue
                
            winner = match.get_winner()
            if winner:
                winners.append(winner.name)
                winner_scores.append(match.final_scores[winner.name])
        
        return {
            "round_number": round_idx + 1,
            "match_count": len(round_matches),
            "completed_matches": sum(1 for m in round_matches if m.is_complete),
            "winners": winners,
            "avg_winner_score": sum(winner_scores) / len(winner_scores) if winner_scores else 0,
            "highest_score": max(winner_scores) if winner_scores else 0
        }


# Example of usage
def parse_match_from_text(match_text: str, league: League) -> Optional[Match]:
    """Parse a match from text format."""
    lines = match_text.strip().split('\n')
    
    # Extract player names and initial ratings
    header_pattern = r"\((\d+)\)(\w+)\s+\((\d+)\)(\w+)"
    header_match = re.match(header_pattern, lines[0])
    
    if not header_match:
        return None
    
    p1_rating, p1_name, p2_rating, p2_name = header_match.groups()
    
    match = league.create_match(p1_name, p2_name)
    
    # Parse moves
    move_pattern = r"^\s*\d+\.\s+(\w+)\s+(\w+)\s+(\d+)\s+(\w+)\s+(\w+)\s+(\d+)$"
    
    p1_score = 0
    p2_score = 0
    
    for line in lines[1:-2]:  # Skip header and footer
        move_match = re.match(move_pattern, line)
        if not move_match:
            if "PASS" in line:
                # Handle PASS
                continue
            elif "CHANGE" in line:
                # Handle tile changes
                continue
            else:
                continue
        
        p1_pos, p1_word, p1_points, p2_pos, p2_word, p2_points = move_match.groups()
        
        p1_points = int(p1_points)
        p2_points = int(p2_points)
        
        # Record the moves
        match.record_move(p1_name, p1_points)
        match.record_move(p2_name, p2_points)
        
        p1 = league.get_player(p1_name)
        p2 = league.get_player(p2_name)
        
        # Add move to player stats 
        p1.add_move(p1_word, p1_points, is_bingo=(len(p1_word) == 7))
        p2.add_move(p2_word, p2_points, is_bingo=(len(p2_word) == 7))
        
        p1_score += p1_points
        p2_score += p2_points
    
    # Parse final score
    final_score_line = lines[-2].strip()
    if final_score_line.startswith("_"):
        try:
            final_scores = lines[-1].strip().split()
            if len(final_scores) >= 2:
                p1_score = int(final_scores[0])
                p2_score = int(final_scores[-1])
        except (ValueError, IndexError):
            # Use accumulated scores if can't parse final line
            pass
    
    match.complete_match(p1_score, p2_score)
    return match


def analyze_match_examples(file_path: str) -> Dict:
    """Analyze match examples from a file."""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        return {"error": f"File not found: {file_path}"}
    
    # Split content into individual matches
    match_sections = content.split('## Situation')
    
    league = League("Example League")
    
    for section in match_sections[1:]:  # Skip the header
        match_text = section.split('```')[1]  # Extract the text between ```
        match = parse_match_from_text(match_text, league)
    
    return league.get_league_statistics()


@dataclass
class GameStats:
    """Represents statistics for a Scrabble game."""
    game_date: str
    players: List[str]
    scores: Dict[str, int]
    move_count: Dict[str, int] 
    highest_scoring_move: Dict[str, Tuple[str, int]]
    longest_word: Dict[str, Tuple[str, int]]
    average_score_per_move: Dict[str, float]
    game_duration: int  # in minutes
    winner: str

@dataclass
class PlayerStats:
    """Aggregated statistics for a player across multiple games."""
    player_name: str
    games_played: int
    games_won: int
    total_score: int
    average_score: float
    highest_score: int
    highest_scoring_move: Tuple[str, int]
    longest_word: Tuple[str, int]
    average_word_length: float

class StatsTracker:
    """Tracks and manages game statistics."""
    
    def __init__(self, stats_file: str = None):
        """Initialize stats tracker with optional stats file path."""
        self.stats_file = stats_file or os.path.join(os.path.dirname(__file__), 'game_stats.json')
        self.games: List[GameStats] = []
        self.load_stats()
    
    def load_stats(self) -> None:
        """Load statistics from file if it exists."""
        if os.path.exists(self.stats_file):
            try:
                with open(self.stats_file, 'r') as f:
                    data = json.load(f)
                    self.games = [GameStats(**game) for game in data]
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Error loading stats: {e}")
                self.games = []
    
    def save_stats(self) -> None:
        """Save game statistics to file."""
        with open(self.stats_file, 'w') as f:
            json.dump([asdict(game) for game in self.games], f, indent=2)
    
    def add_game(self, game_stats: GameStats) -> None:
        """Add a game to statistics and save."""
        self.games.append(game_stats)
        self.save_stats()
    
    def get_player_stats(self, player_name: str) -> PlayerStats:
        """Calculate aggregated stats for a specific player."""
        player_games = [g for g in self.games if player_name in g.players]
        
        if not player_games:
            return None
        
        games_won = sum(1 for g in player_games if g.winner == player_name)
        total_score = sum(g.scores.get(player_name, 0) for g in player_games)
        avg_score = total_score / len(player_games) if player_games else 0
        
        # Find highest score
        highest_score = max((g.scores.get(player_name, 0) for g in player_games), default=0)
        
        # Find highest scoring move
        highest_moves = [g.highest_scoring_move.get(player_name, ("", 0)) for g in player_games]
        highest_move = max(highest_moves, key=lambda x: x[1], default=("", 0))
        
        # Find longest word
        longest_words = [g.longest_word.get(player_name, ("", 0)) for g in player_games]
        longest = max(longest_words, key=lambda x: x[1], default=("", 0))
        
        # Calculate average word length
        total_moves = sum(g.move_count.get(player_name, 0) for g in player_games)
        avg_word_length = total_score / total_moves if total_moves > 0 else 0
        
        return PlayerStats(
            player_name=player_name,
            games_played=len(player_games),
            games_won=games_won,
            total_score=total_score,
            average_score=avg_score,
            highest_score=highest_score,
            highest_scoring_move=highest_move,
            longest_word=longest,
            average_word_length=avg_word_length
        )
    
    def get_all_players(self) -> List[str]:
        """Get a list of all players in the stats."""
        players = set()
        for game in self.games:
            players.update(game.players)
        return sorted(list(players))
    
    def get_games_df(self) -> pd.DataFrame:
        """Convert games to a pandas DataFrame."""
        if not self.games:
            return pd.DataFrame()
        
        games_data = []
        for game in self.games:
            game_dict = asdict(game)
            # Flatten nested dictionaries for easier DataFrame handling
            base_data = {
                'game_date': game_dict['game_date'],
                'players': ', '.join(game_dict['players']),
                'game_duration': game_dict['game_duration'],
                'winner': game_dict['winner']
            }
            
            # Add player-specific data
            for player in game_dict['players']:
                base_data[f'{player}_score'] = game_dict['scores'].get(player, 0)
                base_data[f'{player}_moves'] = game_dict['move_count'].get(player, 0)
                
                # Handle highest scoring move
                if player in game_dict['highest_scoring_move']:
                    word, score = game_dict['highest_scoring_move'][player]
                    base_data[f'{player}_highest_move'] = f"{word} ({score})"
                
                # Handle longest word
                if player in game_dict['longest_word']:
                    word, length = game_dict['longest_word'][player]
                    base_data[f'{player}_longest'] = f"{word} ({length})"
            
            games_data.append(base_data)
        
        return pd.DataFrame(games_data)

def create_game_stats(players: List[str], move_history: List[Tuple[str, Move, int]], 
                      game_duration: int) -> GameStats:
    """Create a GameStats object from game data."""
    # Initialize dictionaries for player stats
    scores = {player: 0 for player in players}
    move_counts = {player: 0 for player in players}
    highest_moves = {player: ("", 0) for player in players}
    longest_words = {player: ("", 0) for player in players}
    
    # Calculate stats from move history
    for player, move, score in move_history:
        # Update score and move count
        scores[player] += score
        move_counts[player] += 1
        
        # Check for highest scoring move
        if score > highest_moves[player][1]:
            highest_moves[player] = (move.word, score)
        
        # Check for longest word
        if len(move.word) > longest_words[player][1]:
            longest_words[player] = (move.word, len(move.word))
    
    # Calculate average score per move
    avg_scores = {
        player: scores[player] / move_counts[player] if move_counts[player] > 0 else 0
        for player in players
    }
    
    # Determine winner
    winner = max(scores.items(), key=lambda x: x[1])[0] if scores else ""
    
    return GameStats(
        game_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        players=players,
        scores=scores,
        move_count=move_counts,
        highest_scoring_move=highest_moves,
        longest_word=longest_words,
        average_score_per_move=avg_scores,
        game_duration=game_duration,
        winner=winner
    )

