import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity,
  FlatList, StatusBar, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const QUESTIONS = [
  { key: 'man_city_appearances', text: 'Man City - Premier League appearances (2014-2024)', url: 'https://braindump-ai-backend-2.onrender.com/man-city/appearances' },
  { key: 'man_city_ga', text: 'Man City - Premier League goals+assists (2014-2024)', url: 'https://braindump-ai-backend-2.onrender.com/man-city/goals-assists' },
  { key: 'liverpool_appearances', text: 'Liverpool - Premier League appearances (2014-2024)', url: 'https://braindump-ai-backend-2.onrender.com/liverpool/appearances' },
  { key: 'liverpool_ga', text: 'Liverpool - Premier League goals+assists (2014-2024)', url: 'https://braindump-ai-backend-2.onrender.com/liverpool/goals-assists' },
];

export default function App() {
  const [screen, setScreen] = useState('setup');
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const [numPlayers, setNumPlayers] = useState(2);
  const [scores, setScores] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [query, setQuery] = useState('');
  const [usedIds, setUsedIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(QUESTIONS[0]);

  useEffect(() => {
    pickRandomQuestion();
  }, []);

  useEffect(() => {
    if (!currentQuestion) return;
    const loadPlayers = async () => {
      setLoading(true);
      try {
        const res = await fetch(currentQuestion.url);
        const data = await res.json();
        if (Array.isArray(data)) setAllPlayers(data);
      } catch (e) {
        console.log('API not ready yet', e);
      } finally {
        setLoading(false);
      }
    };
    loadPlayers();
  }, [currentQuestion]);

  const pickRandomQuestion = () => {
    const random = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    setCurrentQuestion(random);
    // Reset all scores when picking new question
    setScores(playerNames.slice(0, numPlayers).filter(n => n.trim()).map(n => ({
      name: n,
      score: 501,
      history: [501]
    })));
    setUsedIds([]);
    setQuery('');
    setFeedback(null);
  };

  const startGame = () => {
    const names = playerNames.slice(0, numPlayers).filter(n => n.trim());
    if (names.length < 2) return Alert.alert('Need 2+ players!');
    setScores(names.map(n => ({ name: n, score: 501, history: [501] })));
    setUsedIds([]);
    setScreen('game');
  };

  const throwDart = (player) => {
    const current = scores[currentPlayer];
    let value = currentQuestion.key.includes('ga') ? player.ga || 0 : player.appearances || 0;

    if (value > 180) {
      setFeedback({ type: 'noscore', value });
      setTimeout(() => { setFeedback(null); setQuery(''); nextTurn(); }, 1600);
      return;
    }

    let newScores = [...scores];
    let nextTurnDelay = 1600;

    if (value === current.score) {
      // Double Checkout
      newScores[currentPlayer].score -= value * 2;
      newScores[currentPlayer].history.push(newScores[currentPlayer].score);
      setFeedback({ type: 'double', name: player.name, value });
    } else if (value > current.score && value <= current.score + 10) {
      // Buffer win
      let overshoot = current.score - value;
      newScores[currentPlayer].score -= value;
      newScores[currentPlayer].history.push(newScores[currentPlayer].score);
      setFeedback({ type: 'checkout', name: player.name, value, overshoot });
    } else if (value > current.score) {
      // Bust
      setFeedback({ type: 'bust', value });
      setTimeout(() => { setFeedback(null); setQuery(''); nextTurn(); }, nextTurnDelay);
      return;
    } else {
      // Normal score
      newScores[currentPlayer].score -= value;
      newScores[currentPlayer].history.push(newScores[currentPlayer].score);
      setFeedback({ type: 'score', name: player.name, value });
    }

    setScores(newScores);
    setUsedIds([...usedIds, player.id]);
    setQuery('');

    setTimeout(() => { setFeedback(null); nextTurn(); }, nextTurnDelay);
  };

  const nextTurn = () => setCurrentPlayer((currentPlayer + 1) % numPlayers);

  const suggestions = query
    ? allPlayers
        .filter(p => !usedIds.includes(p.id))
        .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
    : [];

  if (screen === 'setup') {
    return (
      <LinearGradient colors={['#000', '#111']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 30 }}>
          <Text style={{ fontSize: 52, fontWeight: '900', color: '#00ff9d', textAlign: 'center', marginBottom: 60 }}>
            FootyDarts 501
          </Text>
          <Text style={{ color: '#fff', fontSize: 24, textAlign: 'center', marginBottom: 20 }}>How many players?</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 40 }}>
            {[2,3,4].map(n => (
              <TouchableOpacity key={n} onPress={() => setNumPlayers(n)}
                style={{ backgroundColor: numPlayers===n ? '#00ff9d' : '#ffffff33', padding: 20, borderRadius: 16, width: 90 }}>
                <Text style={{ color: '#fff', fontSize: 32, textAlign: 'center', fontWeight: 'bold' }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {playerNames.slice(0,numPlayers).map((name,i) => (
            <TextInput key={i} placeholder={`Player ${i+1} name`} value={name}
              onChangeText={t => { const u=[...playerNames]; u[i]=t; setPlayerNames(u); }}
              style={{ backgroundColor: '#111', color:'#fff', padding: 18, borderRadius: 16, marginBottom: 16, fontSize: 20 }} />
          ))}
          <TouchableOpacity onPress={startGame}
            style={{ backgroundColor: '#00ff9d', padding: 22, borderRadius: 20, marginTop: 30 }}>
            <Text style={{ textAlign: 'center', fontSize: 28, fontWeight: 'bold', color: '#000' }}>START GAME</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (loading || allPlayers.length === 0) {
    return (
      <LinearGradient colors={['#000', '#111']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00ff9d" />
        <Text style={{ color: '#fff', fontSize: 24, marginTop: 20 }}>Loading players...</Text>
      </LinearGradient>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000', '#111']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, padding: 20 }}>
          {/* Current Question */}
          <Text style={{ color:'#00ff9d', fontSize: 24, fontWeight:'700', textAlign:'center', marginBottom:10 }}>
            {currentQuestion.text}
          </Text>
          <TouchableOpacity onPress={pickRandomQuestion} style={{ backgroundColor:'#222', padding:10, borderRadius:10, alignSelf:'center', marginBottom:20 }}>
            <Text style={{ color:'#fff', fontSize:16 }}>Next Question</Text>
          </TouchableOpacity>

          {/* Scoreboard */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:20 }}>
            {scores.map((p,i) => (
              <View key={i} style={{ alignItems:'center', marginRight:20 }}>
                <Text style={{ color:i===currentPlayer?'#00ff9d':'#fff', fontWeight:'bold', fontSize:18 }}>{p.name}</Text>
                {p.history.map((h,j)=>(
                  <Text key={j} style={{ color:j===p.history.length-1?'#00ff9d':'#888', fontSize:16 }}>{h}</Text>
                ))}
              </View>
            ))}
          </ScrollView>

          {/* Feedback */}
          <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
            {feedback?.type==='bust' && <Text style={{ fontSize:50,color:'#ff3366',textAlign:'center', marginBottom:10 }}>BUST! ({feedback.value})</Text>}
            {feedback?.type==='noscore' && <Text style={{ fontSize:50,color:'#ffcc00',textAlign:'center', marginBottom:10 }}>No Score! ({feedback.value})</Text>}
            {feedback?.type==='checkout' && <Text style={{ fontSize:40,color:'#00ff9d',textAlign:'center', marginBottom:10 }}>
              Checkout! Overshoot: {feedback.overshoot}
            </Text>}
            {feedback?.type==='double' && <Text style={{ fontSize:40,color:'#00ff9d',textAlign:'center', marginBottom:10 }}>Double Checkout!</Text>}
            {feedback?.type==='score' && <Text style={{ fontSize:36,color:'#ff3366',textAlign:'center', marginBottom:10 }}>â{feedback.value}</Text>}
          </View>

          {/* Input */}
          <TextInput
            placeholder="Search player..."
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery}
            autoFocus
            style={{
              backgroundColor: '#111', color:'#fff', fontSize: 26, padding: 20,
              borderRadius: 16, textAlign: 'center', borderWidth:2, borderColor:'#00ff9d'
            }}
          />

          {/* Suggestions */}
          <FlatList
            data={suggestions}
            keyExtractor={item=>item.id.toString()}
            keyboardShouldPersistTaps="always"
            style={{ marginTop:20 }}
            renderItem={({item})=>(
              <TouchableOpacity onPress={()=>throwDart(item)}
                style={{ backgroundColor:'#222', padding:16, borderRadius:12, marginVertical:5 }}>
                <Text style={{ color:'#fff', fontSize:20, fontWeight:'600' }}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}
