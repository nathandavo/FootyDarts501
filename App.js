import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity,
  FlatList, StatusBar, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// FIXED URLs — these now actually work
const QUESTIONS = [
  { text: "Man City PL appearances (2014- Now)", url: "https://braindump-ai-backend-2.onrender.com/pl/man-city/appearances", key: "appearances" },
  { text: "Man City PL goals + assists(2014- Now)", url: "https://braindump-ai-backend-2.onrender.com/pl/man-city/goals-assists", key: "ga" },
  { text: "Liverpool PL appearances(2014- Now)", url: "https://braindump-ai-backend-2.onrender.com/pl/liverpool/appearances", key: "appearances" },
  { text: "Liverpool PL goals + assists(2014- Now)", url: "https://braindump-ai-backend-2.onrender.com/pl/liverpool/goals-assists", key: "ga" }
];

export default function App() {
  const [screen, setScreen] = useState('setup');
  const [showRules, setShowRules] = useState(true);
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const [numPlayers, setNumPlayers] = useState(1);
  const [scores, setScores] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [query, setQuery] = useState('');
  const [usedIds, setUsedIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState(null);

  const loadQuestion = async (q) => {
    setLoading(true);
    setQuestion(q);
    try {
      const res = await fetch(q.url);
      const data = await res.json();
      if (Array.isArray(data)) {
        const filtered = data.filter(p => p[q.key] > 0);
        setAllPlayers(filtered);
      }
    } catch (e) {
      Alert.alert("Error", "Could not load players – check internet");
    } finally {
      setLoading(false);
    }
  };

  const startGame = () => {
    const names = playerNames.slice(0, numPlayers).map(n => n.trim()).filter(Boolean);
    if (!names.length) return Alert.alert("Enter at least one name!");
    setScores(names.map(n => ({ name: n, score: 501, history: [501] })));
    setUsedIds([]);
    setCurrentPlayer(0);
    setQuery('');
    setScreen('game');
  };

  useEffect(() => {
    loadQuestion(QUESTIONS[0]);
  }, []);

  const throwDart = (player) => {
    const value = player[question.key];
    if (value > 180) {
      setFeedback({ type: 'no-score', name: player.name, value });
      setTimeout(() => { setFeedback(null); setQuery(''); }, 1800);
      return;
    }

    const newScore = scores[currentPlayer].score - value;
    let type = 'score';

    if (newScore === 0) {
      type = 'win';
    } 
    else if (newScore < 0 && newScore >= -10) {
      type = 'buffer-win';
    } 
    else if (newScore < -10 || newScore === 1) {
      type = 'bust';
    }

    setFeedback({ type, name: player.name, value });

    if (type !== 'bust') {
      const updated = [...scores];
      const finalScore = newScore; // allow negative values for buffer win
      updated[currentPlayer].score = finalScore;
      updated[currentPlayer].history.push(finalScore);
      setScores(updated);
      setUsedIds(prev => [...prev, String(player.id)]);
    }

    setQuery('');
    setTimeout(() => {
      setFeedback(null);
      if (type !== 'win') setCurrentPlayer((currentPlayer + 1) % numPlayers);
    }, 2200);
  };

  const nextQuestion = () => {
    const next = (QUESTIONS.indexOf(question) + 1) % QUESTIONS.length;
    loadQuestion(QUESTIONS[next]);
    setScreen('setup');
  };

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return allPlayers
      .filter(p => !usedIds.includes(String(p.id)))
      .filter(p => p.name.toLowerCase().includes(lower))
      .slice(0, 12);
  }, [query, allPlayers, usedIds]);

  if (screen === 'setup') {
    return (
      <LinearGradient colors={['#000', '#222']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, padding: 20, justifyContent: 'center' }}>

          {showRules && (
            <View style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.98)',
              zIndex: 999,
              padding: 30,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{ color: '#0f0', fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 30 }}>
                Welcome to FootyDarts 501
              </Text>

              <ScrollView style={{ maxHeight: '70%', backgroundColor: 'rgba(20,20,20,0.9)', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#0f0' }}>
                <Text style={{ color: '#fff', fontSize: 17, lineHeight: 26 }}>
                  1. This game uses real football stats as dart scores.{'\n'}
                  2. Everyone starts on 501.{'\n'}
                  3. Type a player name and select them to throw.{'\n'}
                  4. Your score goes down by that player's stat value.{'\n'}
                  5. Standard darts rules apply: you cannot score more than 180.{'\n'}
                  6. If a player's stat is over 180 → NO SCORE.{'\n'}
                  7. To win, finish with:{'\n'}
                  {'   '}• Exact 0 → Perfect Checkout{'\n'}
                  {'   '}• Between 0 and -10 → Buffer Win{'\n'}
                  8. Below -10 → BUST (retry){'\n'}
                  9. Scores shown in clean columns.{'\n'}
                  10. Turns rotate automatically.
                </Text>
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowRules(false)}
                style={{ backgroundColor: '#0f0', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, marginTop: 30 }}
              >
                <Text style={{ color: '#000', fontSize: 26, fontWeight: '900' }}>GOT IT – LET'S PLAY!</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={{ fontSize: 42, fontWeight: '900', color: '#0f0', textAlign: 'center', marginBottom: 20 }}>
            FootyDarts 501
          </Text>
          <Text style={{ color: '#aaa', fontSize: 17, textAlign: 'center', marginBottom: 40 }}>
            Blind darts – real Premier League stats
          </Text>

          <Text style={{ color: '#fff', marginBottom: 10 }}>Players:</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 20 }}>
            {[1,2,3,4].map(n => (
              <TouchableOpacity key={n} onPress={() => setNumPlayers(n)}
                style={{ backgroundColor: numPlayers===n ? '#0f0' : '#333', padding: 14, borderRadius: 12, width: 60 }}>
                <Text style={{ color: numPlayers===n ? '#000' : '#fff', fontSize: 22, fontWeight: 'bold', textAlign:'center'}}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {playerNames.slice(0,numPlayers).map((name,i) => (
            <TextInput key={i} placeholder={`Player ${i+1}`} value={name}
              onChangeText={t => { const a=[...playerNames]; a[i]=t; setPlayerNames(a); }}
              style={{ backgroundColor:'#333', color:'#fff', padding:16, borderRadius:12, marginBottom:12, fontSize:18 }} />
          ))}

          <TouchableOpacity onPress={startGame}
            style={{ backgroundColor:'#0f0', padding:18, borderRadius:12, marginTop:20 }}>
            <Text style={{ textAlign:'center', fontSize:24, fontWeight:'bold', color:'#000' }}>START GAME</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (loading) {
    return (
      <LinearGradient colors={['#000','#222']} style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <ActivityIndicator size="large" color="#0f0" />
        <Text style={{color:'#fff',marginTop:20,fontSize:18}}>Loading players…</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000', '#222']} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={{ color:'#0f0', fontSize:20, fontWeight:'bold', textAlign:'center', padding:12, backgroundColor:'#111' }}>
          {question?.text}
        </Text>

        <View style={{ paddingHorizontal:16, paddingTop:12, backgroundColor:'#000' }}>
          <TextInput
            placeholder="Type player name..."
            placeholderTextColor="#777"
            value={query}
            onChangeText={setQuery}
            autoFocus
            style={{ backgroundColor:'#333', color:'#fff', fontSize:20, padding:16, borderRadius:12 }}
          />

          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={item => String(item.id)}
              style={{ maxHeight: 340, marginTop: 8 }}
              renderItem={({item}) => (
                <TouchableOpacity
                  onPress={() => throwDart(item)}
                  style={{ backgroundColor:'#333', padding:18, borderRadius:12, marginBottom:6 }}
                >
                  <Text style={{ color:'#fff', fontSize:19, fontWeight:'600' }}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {feedback && (
          <View style={{ padding:20, alignItems:'center' }}>
            {feedback.type === 'score' && <Text style={{color:'#0f0',fontSize:50,fontWeight:'900'}}>{feedback.name} −{feedback.value}</Text>}
            {feedback.type === 'bust' && <Text style={{color:'#ff0',fontSize:56,fontWeight:'900'}}>{feedback.name} → BUST!</Text>}
            {feedback.type === 'win' && <Text style={{color:'#0f0',fontSize:60,fontWeight:'900',textShadowColor:'#0f0',textShadowRadius:20}}>{feedback.name} WINS!</Text>}
            {feedback.type === 'no-score' && <Text style={{color:'#f55',fontSize:42,fontWeight:'900'}}>{feedback.name} → No score ({feedback.value})</Text>}
            {feedback.type === 'buffer-win' && (
              <Text style={{color:'#0ff',fontSize:50,fontWeight:'900'}}>
                {feedback.name} → BUFFER CHECKOUT!
              </Text>
            )}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex:1 }}>
          <View style={{ flexDirection:'row', gap:34, padding:16 }}>
            {scores.map((player, idx) => {
              const cols = [];
              for (let i = 0; i < player.history.length; i += 4)
                cols.push(player.history.slice(i, i+4));

              return (
                <View key={idx} style={{ minWidth:110, alignItems:'center' }}>
                  <Text style={{ color:idx===currentPlayer?'#0f0':'#fff', fontSize:18, fontWeight:'bold', marginBottom:12 }}>
                    {player.name}
                  </Text>
                  {cols.map((col, ci) => (
                    <View key={ci} style={{ alignItems:'center', marginBottom:8 }}>
                      {col.map((s,i) => (
                        <Text key={i} style={{
                          fontSize:34, fontWeight:'900',
                          color: s === player.score ? '#0f0' : '#aaa',
                          minWidth:80, textAlign:'center'
                        }}>
                          {s}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </ScrollView>

        <TouchableOpacity onPress={nextQuestion}
          style={{ position:'absolute', bottom:20, right:20, backgroundColor:'#0f0', padding:14, borderRadius:12 }}>
          <Text style={{ color:'#000', fontWeight:'bold', fontSize:16 }}>Next Question</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}
