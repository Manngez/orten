export interface City { name: string; lat: number; lng: number }
export interface Point { x: number; y: number }
export interface PlacedCity { city: City; point: Point; playerIndex: number; turnNumber: number; points: number }
export interface LineSegment { from: Point; to: Point; playerIndex: number; turnNumber: number }
export type GamePhase = "setup" | "playing" | "gameover";
export type GameMode = "classic" | "blitz";
export interface PlayerStats {
  name: string; totalGames: number; wins: number; citiesPlaced: number;
  timesEliminated: number; totalScore: number; bestScore: number;
}
export interface EliminationEvent { playerName: string; cityName: string }
export interface GameRecord {
  id: string; date: string; players: string[]; winner: string; totalCities: number;
  eliminationOrder: EliminationEvent[]; mode: GameMode; scores: number[];
}
export interface GameState {
  phase: GamePhase; mode: GameMode; players: string[]; eliminated: boolean[];
  eliminationOrder: EliminationEvent[]; currentPlayerIndex: number;
  placedCities: PlacedCity[]; usedCityNames: Set<string>; lines: LineSegment[];
  lastElimination: EliminationEvent | null;
  crossingLines: [LineSegment, LineSegment] | null; winner: string | null;
  scores: number[];
}
