import { NextRequest, NextResponse } from 'next/server';
import { PlayerRepository } from '@/api/repository/playerRepository';
import { PlayerMatch } from '@/types/Player';
import { MatchStatus, MatchStatusType } from '@/types/Enums';
import { MatchDisplay } from '@/types/MatchHistory';

const playerRepo = new PlayerRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('Received request:', {
    url: request.url,
    rawId: params.id,
    method: request.method,
    headers: Object.fromEntries(request.headers)
  });

  try {
    // Ensure the ID is properly decoded
    console.log('Attempting to decode ID:', params.id);
    const decodedId = decodeURIComponent(params.id);
    console.log('Decoded ID:', decodedId);
    if (!decodedId.match(/^[a-zA-Z0-9-]+$/)) {
      return NextResponse.json(
        { error: 'Invalid player ID format' },
        { status: 400 }
      );
    }

    const player = await playerRepo.getPlayer(decodedId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get query parameters for filtering
    let searchParams: URLSearchParams;
    try {
      console.log('Original request URL:', request.url);
      // Decode the URL first to handle any encoded characters
      const decodedUrl = decodeURIComponent(request.url);
      console.log('Decoded URL:', decodedUrl);

      // Try parsing the URL
      const parsedUrl = new URL(decodedUrl);
      console.log('Successfully parsed URL:', {
        href: parsedUrl.href,
        pathname: parsedUrl.pathname,
        search: parsedUrl.search
      });

      searchParams = parsedUrl.searchParams;
    } catch (error) {
      console.error('Error parsing URL:', {
        url: request.url,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const limit = parseInt(searchParams.get('limit') ?? '10');
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const opponent = searchParams.get('opponent');
    const event = searchParams.get('event');

    // Filter and sort matches
    let matches = Array.isArray(player.matches) ? [...player.matches] : [];
    matches = matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply filters
    if (startDate) {
      matches = matches.filter(m => new Date(m.date) >= new Date(startDate));
    }
    if (endDate) {
      matches = matches.filter(m => new Date(m.date) <= new Date(endDate));
    }
    if (opponent) {
      matches = matches.filter(m => m.opponent.id === opponent);
    }
    if (event) {
      matches = matches.filter(m => m.eventId === event);
    }

    // Calculate total for pagination
    const total = matches.length;

    // Apply pagination
    matches = matches.slice(offset, offset + limit);

    // Calculate match statistics
    const statistics = calculateMatchStatistics(matches);

    console.log(`Starting match transformation for ${matches.length} matches`);
    
    // Transform matches to MatchDisplay format
    const transformedMatches = await Promise.all(matches.map(async (match) => {
      console.log('Processing match:', { matchId: match.matchId, opponentId: match.opponent.id });
      
      // Get opponent details
      const opponent = await playerRepo.getPlayer(match.opponent.id);
      if (!opponent) {
        console.error(`Opponent not found: ${match.opponent.id}`);
        return null;
      }

      const status: MatchStatusType = match.result ? MatchStatus.COMPLETED : MatchStatus.PENDING;
      console.log('Setting match status:', { matchId: match.matchId, status });
      
      return {
        id: match.matchId,
        eventId: match.eventId,
        date: match.date,
        status,
        player1Id: decodedId,
        player2Id: match.opponent.id,
        player1Details: {
          name: player.name,
          category: player.category
        },
        player2Details: {
          name: opponent.name,
          category: opponent.category
        },
        result: match.result
      };
    }));

    // Filter out any null values from failed opponent lookups
    const validMatches = transformedMatches.filter((match): match is NonNullable<typeof match> => match !== null);

    console.log('Match transformation completed:', {
      totalMatches: matches.length,
      validMatches: validMatches.length,
      firstMatch: validMatches[0] ? {
        id: validMatches[0].id,
        status: validMatches[0].status,
        player1: validMatches[0].player1Details.name,
        player2: validMatches[0].player2Details.name
      } : null
    });

    return NextResponse.json({
      matches: validMatches,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total
      },
      statistics
    });
  } catch (error) {
    console.error('Error fetching player matches:', {
      error,
      playerId: params.id,
      url: request.url,
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Player not found', details: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('Invalid')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch player matches', errorId: 'URL_PARSE_ERR_2023' },
      { status: 500 }
    );
  }
}

function calculateMatchStatistics(matches: PlayerMatch[]) {
  if (!matches.length) {
    return {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      averageRatingChange: 0,
      totalRatingChange: 0,
      highestRatingGain: 0,
      worstRatingLoss: 0,
      averagePerformanceRating: 0
    };
  }

  // Only consider completed matches for statistics
  const completedMatches = matches.filter(match => match.result && match.ratingChange);

  if (!completedMatches.length) {
    return {
      totalMatches: matches.length,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      averageRatingChange: 0,
      totalRatingChange: 0,
      highestRatingGain: 0,
      worstRatingLoss: 0,
      averagePerformanceRating: 0
    };
  }

  const stats = completedMatches.reduce((acc, match) => {
    // Safely access match data
    const playerScore = match.result?.score[0] ?? 0;
    const opponentScore = match.result?.score[1] ?? 0;
    if (playerScore > opponentScore) acc.wins++;
    else if (playerScore < opponentScore) acc.losses++;
    else acc.draws++;

    // Track rating changes
    const ratingChange = match.ratingChange?.change ?? 0;
    acc.totalRatingChange += ratingChange;
    acc.highestRatingGain = Math.max(acc.highestRatingGain, ratingChange);
    acc.worstRatingLoss = Math.min(acc.worstRatingLoss, ratingChange);
    acc.totalPerformanceRating += match.result?.pr ?? 0;

    return acc;
  }, {
    wins: 0,
    losses: 0,
    draws: 0,
    totalRatingChange: 0,
    highestRatingGain: -Infinity,
    worstRatingLoss: Infinity,
    totalPerformanceRating: 0
  });

  const totalMatches = completedMatches.length;

  return {
    totalMatches: matches.length,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    winRate: Number(((stats.wins / totalMatches) * 100).toFixed(1)),
    averageRatingChange: Number((stats.totalRatingChange / totalMatches).toFixed(1)),
    totalRatingChange: stats.totalRatingChange,
    highestRatingGain: stats.highestRatingGain === -Infinity ? 0 : stats.highestRatingGain,
    worstRatingLoss: stats.worstRatingLoss === Infinity ? 0 : stats.worstRatingLoss,
    averagePerformanceRating: Number((stats.totalPerformanceRating / totalMatches).toFixed(1))
  };
}