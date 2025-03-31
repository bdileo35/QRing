import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Animated, Easing, Alert, ImageBackground, Switch, Linking } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function App() {
  console.log('APP INICIADA');

  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isWizardMode, setIsWizardMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [activePhoneNumber, setActivePhoneNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [callHistory, setCallHistory] = useState([
    {
      id: Date.now() - 3600000,
      time: new Date(Date.now() - 3600000).toLocaleTimeString(),
      type: 'phone',
      status: 'respondida',
      number: '+54 9 11 1234-5678'
    },
    {
      id: Date.now() - 7200000,
      time: new Date(Date.now() - 7200000).toLocaleTimeString(),
      type: 'whatsapp',
      status: 'respondida',
      number: '+54 9 11 8765-4321'
    },
    {
      id: Date.now() - 10800000,
      time: new Date(Date.now() - 10800000).toLocaleTimeString(),
      type: 'phone',
      status: 'perdida',
      number: '+54 9 11 2345-6789'
    },
    {
      id: Date.now() - 14400000,
      time: new Date(Date.now() - 14400000).toLocaleTimeString(),
      type: 'whatsapp',
      status: 'respondida',
      number: '+54 9 11 3456-7890'
    },
    {
      id: Date.now() - 18000000,
      time: new Date(Date.now() - 18000000).toLocaleTimeString(),
      type: 'phone',
      status: 'perdida',
      number: '+54 9 11 4567-8901'
    }
  ]);
  const fadeAnim = new Animated.Value(1);
  const [callType, setCallType] = useState('phone');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeTextAnim = useRef(new Animated.Value(0)).current;
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [showHistory, setShowHistory] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // Animaciones para el splash screen
  const splashLogoScale = useRef(new Animated.Value(0.3)).current;
  const splashLogoOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  const [callTimeout, setCallTimeout] = useState(30); // segundos para pasar al siguiente número
  const [currentCallIndex, setCurrentCallIndex] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [editingNumber, setEditingNumber] = useState(null);
  const [editingType, setEditingType] = useState('phone');
  const [isConnected, setIsConnected] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [isDragging, setIsDragging] = useState(false);
  const [pressTimer, setPressTimer] = useState(null);
  const [pressProgress, setPressProgress] = useState(0);
  const pressAnimValue = useRef(new Animated.Value(0)).current;
  const [isDND, setIsDND] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Animación del splash screen mejorada
        Animated.sequence([
          // Fade in y scale del logo
          Animated.parallel([
            Animated.timing(splashLogoOpacity, {
              toValue: 1,
              duration: 1500,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.spring(splashLogoScale, {
              toValue: 1,
              tension: 20,
              friction: 7,
              useNativeDriver: true,
            })
          ]),
          // Barra de progreso
          Animated.timing(progressWidth, {
            toValue: 1,
            duration: 2000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: false,
          })
        ]).start();

        // Verificar si hay números guardados
        const savedNumbers = await AsyncStorage.getItem('phoneNumbers');
        if (savedNumbers) {
          const parsedNumbers = JSON.parse(savedNumbers);
          if (parsedNumbers.length > 0 && parsedNumbers[0] !== '') {
            setPhoneNumbers(parsedNumbers);
            setActivePhoneNumber(parsedNumbers[0]);
            setIsFirstTime(false);
            setIsWizardMode(false);
          } else {
            setIsFirstTime(true);
            setIsWizardMode(false);
          }
        } else {
          setIsFirstTime(true);
          setIsWizardMode(false);
        }
        
        // Esperar a que termine la animación
        setTimeout(() => {
          setIsLoading(false);
          startLogoAnimation();
        }, 4000);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const checkFirstTime = async () => {
    try {
      const numbers = await AsyncStorage.getItem('phoneNumbers');
      if (numbers) {
        const parsedNumbers = JSON.parse(numbers);
        setPhoneNumbers(parsedNumbers);
        setActivePhoneNumber(parsedNumbers[0]);
        setIsFirstTime(false);
      }
    } catch (e) {
      console.error('Error loading phone numbers:', e);
    }
  };

  const savePhoneNumbers = async (numbers) => {
    try {
      await AsyncStorage.setItem('phoneNumbers', JSON.stringify(numbers));
    } catch (e) {
      console.error('Error saving phone numbers:', e);
    }
  };

  // Simulación de llamada entrante para demo
  const simulateIncomingCall = () => {
    const newCall = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      type: callType,
      status: 'entrante',
      number: activePhoneNumber
    };
    setCallHistory([newCall, ...callHistory]);
  };

  const startLogoAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        })
      ])
    ).start();

    Animated.timing(fadeTextAnim, {
      toValue: 1,
      duration: 2500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  };

  const renderLogo = () => (
    <View style={styles.logoContainer}>
      <Animated.Text 
        style={[
          styles.logoText,
          {
            transform: [{ scale: pulseAnim }],
            textShadowColor: 'rgba(0, 122, 255, 0.15)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
          }
        ]}
      >
        QR
      </Animated.Text>
      <Animated.Text 
        style={[
          styles.logoSubText,
          {
            opacity: fadeTextAnim,
            transform: [{ 
              translateX: fadeTextAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0]
              })
            }]
          }
        ]}
      >
        ing
      </Animated.Text>
    </View>
  );

  const handleReset = async () => {
    try {
      await AsyncStorage.clear();
      setIsFirstTime(true);
      setPhoneNumbers([]);
      setActivePhoneNumber('');
      setCallHistory([]);
      setCallType('phone');
      setCurrentStep(0);
    } catch (e) {
      console.error('Error resetting app:', e);
    }
  };

  const handleNoButton = () => {
    console.log('1. Botón NO presionado');
    Alert.alert(
      "Recordatorio",
      "Recuerda que necesitarás generar un código QR desde la pantalla principal para que la aplicación funcione.",
      [
        { 
          text: "Entendido",
          onPress: () => {
            console.log('2. Entendido presionado');
            // Forzar el renderizado de la pantalla principal
            setIsWizardMode(false);
            setCurrentStep(0);
            setActivePhoneNumber('');
            setCallType('phone');
            // Forzar un re-render cambiando el estado de phoneNumbers
            setPhoneNumbers([]);
            console.log('3. Estados actualizados, forzando renderizado de PP');
          }
        }
      ]
    );
  };

  const handleYesButton = () => {
    console.log('=== INICIO DEL WIZARD ===');
    console.log('Estados iniciales:', {
      currentStep,
      isWizardMode,
      progressBarWidth,
      phoneNumbers
    });

    // Reiniciar estados
    setProgressBarWidth(0);
    setCurrentStep(0);
    setActivePhoneNumber('');
    setCallType('phone');
    setIsWizardMode(true);
    setIsFirstTime(false);

    console.log('Estados actualizados en handleYesButton');
  };

  const renderMainScreen = () => (
    <View style={styles.mainContainer}>
      <View style={styles.mainContent}>
        {/* Estado del Timbre */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <TouchableOpacity 
              style={[styles.statusIndicator, isConnected ? styles.connected : styles.disconnected]}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              delayLongPress={2000}
            >
              <View style={[styles.statusDot, isConnected ? styles.statusDotConnected : styles.statusDotDisconnected]} />
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusText, isConnected ? styles.statusTextConnected : styles.statusTextDisconnected]}>
                  {isConnected ? 'QRing está activo y funcionando' : 'QRing está desactivado'}
                </Text>
              </View>
              <Animated.View style={[
                styles.pressProgressBar,
                {
                  width: pressAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: isConnected ? 'rgba(255, 59, 48, 0.3)' : 'rgba(52, 199, 89, 0.3)'
                }
              ]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Números Configurados */}
        <View style={styles.numbersCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="phone-settings" size={22} color="#007AFF" />
            <Text style={styles.cardTitle}>Números configurados ({phoneNumbers.length})</Text>
          </View>
          {phoneNumbers.slice(0, 3).map((number, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.numberItem}
              onPress={() => {
                const phoneNumber = typeof number === 'object' ? number.number : number;
                const isWhatsApp = typeof number === 'object' && number.type === 'whatsapp';
                if (isWhatsApp) {
                  Linking.openURL(`whatsapp://send?phone=${phoneNumber.replace(/[^0-9]/g, '')}`);
                } else {
                  Linking.openURL(`tel:${phoneNumber}`);
                }
              }}
            >
              <View style={styles.numberInfo}>
                <MaterialCommunityIcons 
                  name={index === 0 ? "phone-ring" : index === 1 ? "phone-forward" : "phone-alert"} 
                  size={20} 
                  color={index === 0 ? "#34C759" : index === 1 ? "#007AFF" : "#FF9500"} 
                />
                <View style={styles.numberDetails}>
                  <View style={styles.numberRow}>
                    <View style={styles.numberWithIcon}>
                      <Text style={[styles.phoneNumber, index === 0 && { color: '#34C759', fontWeight: '600' }]}>
                        {typeof number === 'object' ? number.number : number}
                      </Text>
                      <MaterialCommunityIcons 
                        name={typeof number === 'object' && number.type === 'whatsapp' ? 'whatsapp' : 'phone'} 
                        size={16} 
                        color={typeof number === 'object' && number.type === 'whatsapp' ? '#25D366' : '#666'} 
                        style={styles.numberTypeIcon}
                      />
                    </View>
                  </View>
                  <View style={styles.priorityRow}>
                    <Text style={styles.priorityText}>
                      {index === 0 ? "Principal" : index === 1 ? "Secundario" : "Emergencia"}
                    </Text>
                    <View style={styles.timeoutInfo}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                      <Text style={styles.timeoutText}>{callTimeout}s</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.actionButtons}>
                {index > 0 && (
                  <TouchableOpacity 
                    style={styles.editButton} 
                    onPress={(e) => {
                      e.stopPropagation();
                      const newNumbers = [...phoneNumbers];
                      const temp = newNumbers[index];
                      newNumbers[index] = newNumbers[index - 1];
                      newNumbers[index - 1] = temp;
                      setPhoneNumbers(newNumbers);
                      savePhoneNumbers(newNumbers);
                    }}
                  >
                    <MaterialCommunityIcons name="arrow-up" size={18} color="#007AFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditPress(typeof number === 'object' ? number.number : number, index);
                  }}
                >
                  <MaterialCommunityIcons name="pencil" size={18} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.editButton, styles.deleteButton]} 
                  onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert(
                      "Eliminar número",
                      "¿Estás seguro de que quieres eliminar este número?",
                      [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Eliminar",
                          style: "destructive",
                          onPress: () => {
                            const newNumbers = phoneNumbers.filter((_, i) => i !== index);
                            setPhoneNumbers(newNumbers);
                            savePhoneNumbers(newNumbers);
                          }
                        }
                      ]
                    );
                  }}
                >
                  <MaterialCommunityIcons name="delete" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          {phoneNumbers.length < 3 && (
            <TouchableOpacity style={styles.addNumberButton} onPress={() => setIsWizardMode(true)}>
              <MaterialCommunityIcons name="phone-plus" size={18} color="#007AFF" />
              <Text style={styles.addNumberText}>Agregar número {
                phoneNumbers.length === 0 ? "principal" :
                phoneNumbers.length === 1 ? "secundario" :
                "de emergencia"
              }</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Últimas Llamadas */}
        <View style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="history" size={22} color="#007AFF" />
            <Text style={styles.cardTitle}>Últimas 5 llamadas</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => {
                setActiveTab('history');
                setShowHistory(true);
                setShowConfig(false);
                setShowHelp(false);
              }}
            >
              <Text style={styles.viewAllText}>Ver todo</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.historyList}>
            {callHistory.slice(0, 5).map(call => (
              <View key={call.id} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyNumber}>{call.number}</Text>
                  <MaterialCommunityIcons 
                    name={call.type === 'phone' ? 'phone' : 'whatsapp'} 
                    size={18} 
                    color={call.type === 'phone' ? '#007AFF' : '#25D366'} 
                  />
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyTime}>{call.time}</Text>
                  <View style={[styles.historyStatus, call.status === 'respondida' ? styles.statusAnswered : styles.statusMissed]}>
                    <Text style={styles.historyStatusText}>{call.status === 'respondida' ? '✓' : '✕'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );

  const steps = [
    {
      title: "¡Bienvenido a QRing!",
      content: "Vamos a crear tu QR personal para tu entrada. Este código permitirá a tus visitantes llamarte fácilmente.",
      buttonText: "Comenzar",
    },
    {
      title: "Ingresa tu número",
      content: "Por favor, ingresa el número de teléfono al que quieres que te llamen tus visitantes.",
      input: true,
      buttonText: "Siguiente",
    },
    {
      title: "¿Cómo quieres que te llamen?",
      content: "Elige cómo prefieres que tus visitantes se comuniquen contigo:",
      showOptions: true,
      buttonText: "Siguiente",
    },
    {
      title: "Instrucciones de instalación",
      content: "Para instalar tu timbre QR:",
      instructions: [
        "1. Guarda una captura de pantalla del código QR",
        "2. Imprímelo en buena calidad",
        "3. Colócalo en un lugar visible cerca de tu entrada",
        "4. Asegúrate de que esté bien iluminado",
        "5. Protégelo de la lluvia si está en exterior",
        "6. Pruébalo escaneándolo con otro teléfono"
      ],
      buttonText: "Ver mi QR",
    },
    {
      title: "¡Tu QR está listo!",
      content: "Este es tu nuevo timbre QR. Guárdalo y colócalo en un lugar visible.",
      showQR: true,
      buttonText: "Finalizar",
      showSaveButton: true,
    }
  ];

  const renderStep = () => {
    const step = steps[currentStep];
    const currentProgress = currentStep / (steps.length - 1);
    
    console.log('=== RENDERIZANDO PASO ===', {
      currentStep,
      stepTitle: step.title,
      hasInput: !!step.input,
      progressBarWidth: currentProgress,
      progressPercent: (currentProgress * 100) + '%'
    });
    
    return (
      <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
        {renderLogo()}
        <Text style={styles.stepTitle}>{step.title}</Text>
        {step.instructions ? (
          <View style={styles.instructionsContainer}>
            <Text style={styles.stepContentInstructions}>{step.content}</Text>
            {step.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={styles.instructionStep}>{instruction}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.stepContent}>{step.content}</Text>
        )}

        {step.input && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Número de teléfono</Text>
            <TextInput
              style={styles.input}
              value={activePhoneNumber}
              onChangeText={setActivePhoneNumber}
              placeholder="Ej: +54 9 11 1234-5678"
              keyboardType="phone-pad"
              placeholderTextColor="#999"
              maxLength={20}
            />
          </View>
        )}

        {step.showOptions && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.optionButton, callType === 'phone' && styles.optionSelected]}
              onPress={() => setCallType('phone')}
            >
              <MaterialCommunityIcons 
                name="phone" 
                size={24} 
                color={callType === 'phone' ? '#fff' : '#007AFF'} 
              />
              <Text style={[
                styles.optionText,
                callType === 'phone' && styles.optionTextSelected
              ]}>Llamada directa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, callType === 'whatsapp' && styles.optionSelected]}
              onPress={() => setCallType('whatsapp')}
            >
              <MaterialCommunityIcons 
                name="whatsapp" 
                size={24} 
                color={callType === 'whatsapp' ? '#fff' : '#25D366'} 
              />
              <Text style={[
                styles.optionText,
                callType === 'whatsapp' && styles.optionTextSelected
              ]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}

        {step.showQR && (
          <View style={styles.qrContainer}>
            <View style={styles.stampContainer}>
              <MaterialCommunityIcons 
                name="bell-ring" 
                size={40} 
                color="#007AFF" 
                style={styles.bellIcon}
              />
              <Text style={styles.stampText}>TIMBRE</Text>
              <MaterialCommunityIcons 
                name="bell-ring" 
                size={40} 
                color="#007AFF" 
                style={styles.bellIcon}
              />
            </View>
            <View style={styles.qrBorder}>
              <QRCode
                value={getQRValue()}
                size={300}
                color="black"
                backgroundColor="white"
              />
            </View>
            <View style={styles.qrFooter}>
              <Text style={styles.qrTitle}>QRing <Text style={styles.versionText}>2.0</Text></Text>
            </View>
          </View>
        )}

        {step.showSaveButton && (
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => {
              Alert.alert(
                "¡Guardado exitoso!",
                "Tu código QR se ha guardado correctamente en la galería.",
                [{ text: "OK" }]
              );
              // Aquí iría la lógica real de guardado
              console.log('QR guardado');
            }}
          >
            <Text style={styles.saveButtonText}>Guardar QR</Text>
          </TouchableOpacity>
        )}

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(currentProgress * 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Paso {currentStep + 1} de {steps.length}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={handleBack}
            >
              <Text style={[styles.buttonText, { color: '#333' }]}>Atrás</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.nextButton,
              currentStep === 0 && styles.soloButton
            ]}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>
              {step.buttonText || "Siguiente"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const handleNext = () => {
    console.log('=== AVANZANDO AL SIGUIENTE PASO ===');
    console.log('Estados antes de avanzar:', {
      currentStep,
      activePhoneNumber,
      isWizardMode,
      totalSteps: steps.length
    });

    // Si estamos en el paso del número de teléfono
    if (currentStep === 1 && !activePhoneNumber) {
      alert('Por favor, ingresa un número de teléfono');
      return;
    }

    // Si es el último paso (Finalizar)
    if (currentStep === steps.length - 1) {
      console.log('Finalizando wizard');
      setPhoneNumbers([...phoneNumbers, activePhoneNumber]);
      setIsWizardMode(false);
      savePhoneNumbers([...phoneNumbers, activePhoneNumber]);
      return;
    }

    // Calcular siguiente paso
    const nextStep = currentStep + 1;
    console.log('Avanzando al paso:', nextStep);
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      // Actualizar la barra de progreso
      const progress = prevStep / (steps.length - 1);
      setProgressBarWidth(progress);
      
      // Animar la transición
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const getQRValue = () => {
    const phoneData = {
      numbers: phoneNumbers,
      timeout: callTimeout,
      type: callType
    };
    
    if (callType === 'whatsapp') {
      return `whatsapp://send?phone=${phoneNumbers[0].replace(/[^0-9]/g, '')}`;
    }
    return `tel:${phoneNumbers[0]}`;
  };

  const renderSplashScreen = () => (
    <View style={styles.splashContainer}>
      <View style={styles.splashBackgroundQR}>
        <QRCode
          value="QRing"
          size={400}
          color="rgba(128,128,128,0.25)"
          backgroundColor="transparent"
        />
      </View>
      <Animated.View style={[
        styles.splashLogoContainer,
        {
          opacity: splashLogoOpacity,
          transform: [{ scale: splashLogoScale }]
        }
      ]}>
        <View style={styles.splashInnerContainer}>
          <Text style={styles.splashLogoText}>QR</Text>
          <Text style={styles.splashLogoSubText}>ing</Text>
          <Text style={styles.splashVersion}>v2.0</Text>
        </View>
        <Text style={styles.splashTagline}>Tu timbre inteligente</Text>
      </Animated.View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground} />
        <Animated.View 
          style={[
            styles.progressBarFill,
            {
              width: progressWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })
            }
          ]}
        />
        <Text style={styles.loadingText}>Iniciando...</Text>
      </View>
    </View>
  );

  const renderBottomBar = () => (
    <View style={styles.bottomBar}>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'home' && styles.tabButtonActive]} 
        onPress={() => {
          setActiveTab('home');
          setShowHistory(false);
          setShowConfig(false);
          setShowHelp(false);
        }}
      >
        <MaterialCommunityIcons 
          name="home" 
          size={24} 
          color={activeTab === 'home' ? '#007AFF' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>
          Inicio
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
        onPress={() => {
          setActiveTab('history');
          setShowHistory(true);
          setShowConfig(false);
          setShowHelp(false);
        }}
      >
        <MaterialCommunityIcons 
          name="history" 
          size={24} 
          color={activeTab === 'history' ? '#007AFF' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
          Historial
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'config' && styles.tabButtonActive]}
        onPress={() => {
          setActiveTab('config');
          setShowConfig(true);
          setShowHistory(false);
          setShowHelp(false);
        }}
      >
        <Ionicons 
          name="settings-outline" 
          size={24} 
          color={activeTab === 'config' ? '#007AFF' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'config' && styles.tabTextActive]}>
          Config
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'help' && styles.tabButtonActive]}
        onPress={() => {
          setActiveTab('help');
          setShowHelp(true);
          setShowHistory(false);
          setShowConfig(false);
        }}
      >
        <MaterialCommunityIcons 
          name="help-circle-outline" 
          size={24} 
          color={activeTab === 'help' ? '#007AFF' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'help' && styles.tabTextActive]}>
          Ayuda
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.historyContainer}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyHeaderText}>Historial de Llamadas</Text>
        <View style={styles.historyStats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="phone-check" size={20} color="#34C759" />
            <Text style={styles.statText}>
              {callHistory.filter(call => call.status === 'respondida').length} Respondidas
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="phone-missed" size={20} color="#FF3B30" />
            <Text style={styles.statText}>
              {callHistory.filter(call => call.status === 'perdida').length} Perdidas
            </Text>
          </View>
        </View>
      </View>
      <ScrollView style={styles.historyList}>
        {callHistory.map(call => (
          <View key={call.id} style={styles.historyDetailItem}>
            <View style={styles.historyItemHeader}>
              <Text style={styles.historyDate}>
                {new Date(call.id).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              <Text style={styles.historyTime}>{call.time}</Text>
            </View>
            <View style={styles.historyItemContent}>
              <View style={styles.historyTypeContainer}>
                {call.type === 'phone' ? (
                  <MaterialCommunityIcons name="phone" size={20} color="#007AFF" />
                ) : (
                  <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
                )}
                <Text style={styles.historyNumber}>{call.number}</Text>
              </View>
              <View style={[
                styles.historyStatus,
                call.status === 'respondida' ? styles.statusAnswered : styles.statusMissed
              ]}>
                <Text style={styles.historyStatusText}>
                  {call.status === 'respondida' ? '✓ Respondida' : '✕ Perdida'}
                </Text>
              </View>
            </View>
          </View>
        ))}
        {callHistory.length === 0 && (
          <View style={styles.emptyHistory}>
            <MaterialCommunityIcons name="history" size={48} color="#ccc" />
            <Text style={styles.noHistoryText}>No hay llamadas registradas</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderConfig = () => (
    <View style={styles.configContainer}>
      <View style={styles.configHeader}>
        <Text style={styles.configHeaderText}>Configuración</Text>
        <Text style={styles.configSubText}>Personaliza tu experiencia</Text>
      </View>

      <ScrollView style={styles.configContent}>
        {/* Sección de QR */}
        <View style={styles.configSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="qrcode" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Timbre QR</Text>
          </View>
          
          <TouchableOpacity style={styles.configItem}>
            <View style={styles.configItemInfo}>
              <Text style={styles.configItemTitle}>Imprimir QR</Text>
              <Text style={styles.configItemDescription}>
                Genera una nueva copia del código QR de tu timbre
              </Text>
            </View>
            <MaterialCommunityIcons name="printer" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Sección de Llamadas */}
        <View style={styles.configSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="phone-settings" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Configuración de Llamadas</Text>
          </View>
          
          <View style={styles.configItem}>
            <View style={styles.configItemInfo}>
              <Text style={styles.configItemTitle}>Tiempo de espera</Text>
              <Text style={styles.configItemDescription}>
                Tiempo máximo de espera antes de pasar al siguiente número
              </Text>
            </View>
            <View style={styles.timeoutSelector}>
              <TouchableOpacity 
                style={[styles.timeoutButton, callTimeout === 15 && styles.timeoutButtonActive]}
                onPress={() => setCallTimeout(15)}
              >
                <Text style={[styles.timeoutButtonText, callTimeout === 15 && styles.timeoutButtonTextActive]}>15s</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.timeoutButton, callTimeout === 30 && styles.timeoutButtonActive]}
                onPress={() => setCallTimeout(30)}
              >
                <Text style={[styles.timeoutButtonText, callTimeout === 30 && styles.timeoutButtonTextActive]}>30s</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.timeoutButton, callTimeout === 45 && styles.timeoutButtonActive]}
                onPress={() => setCallTimeout(45)}
              >
                <Text style={[styles.timeoutButtonText, callTimeout === 45 && styles.timeoutButtonTextActive]}>45s</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.configItem}>
            <View style={styles.configItemInfo}>
              <Text style={styles.configItemTitle}>Orden de llamadas</Text>
              <Text style={styles.configItemDescription}>
                Configura el orden de los números para las llamadas en cascada
              </Text>
            </View>
            <View style={styles.orderButtons}>
              <TouchableOpacity 
                style={styles.orderButton}
                onPress={() => {
                  const newNumbers = [...phoneNumbers];
                  const temp = newNumbers[0];
                  newNumbers[0] = newNumbers[1];
                  newNumbers[1] = temp;
                  setPhoneNumbers(newNumbers);
                  savePhoneNumbers(newNumbers);
                }}
              >
                <MaterialCommunityIcons name="arrow-up-down" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Sección de Notificaciones */}
        <View style={styles.configSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Notificaciones</Text>
          </View>
          
          <View style={styles.configItem}>
            <View style={styles.configItemInfo}>
              <Text style={styles.configItemTitle}>Notificaciones push</Text>
              <Text style={styles.configItemDescription}>
                Recibe notificaciones cuando alguien toque el timbre
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={true ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.configItem}>
            <View style={styles.configItemInfo}>
              <Text style={styles.configItemTitle}>Sonido de notificación</Text>
              <Text style={styles.configItemDescription}>
                Activa el sonido al recibir notificaciones
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={true ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Sección de Apariencia */}
        <View style={styles.configSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="palette-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Apariencia</Text>
          </View>
          
          <View style={styles.configItem}>
            <View style={styles.configItemInfo}>
              <Text style={styles.configItemTitle}>Tema oscuro</Text>
              <Text style={styles.configItemDescription}>
                Activa el tema oscuro para mejor visibilidad nocturna
              </Text>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={false ? '#f4f3f4' : '#007AFF'}
            />
          </View>
        </View>

        {/* Sección de Datos */}
        <View style={styles.configSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="database-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Datos y Respaldo</Text>
          </View>
          
          <TouchableOpacity style={styles.configItem}>
            <View style={styles.configItemInfo}>
              <Text style={styles.configItemTitle}>Exportar datos</Text>
              <Text style={styles.configItemDescription}>
                Guarda una copia de tu configuración y historial
              </Text>
            </View>
            <MaterialCommunityIcons name="export" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.configItem}>
            <View style={styles.configItemInfo}>
              <Text style={styles.configItemTitle}>Borrar historial</Text>
              <Text style={styles.configItemDescription}>
                Elimina todo el historial de llamadas
              </Text>
            </View>
            <MaterialCommunityIcons name="delete" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const renderHelp = () => (
    <View style={styles.helpContainer}>
      <View style={styles.helpHeader}>
        <Text style={styles.helpHeaderText}>Centro de Ayuda</Text>
        <Text style={styles.helpSubText}>Encuentra respuestas a tus preguntas</Text>
      </View>

      <ScrollView style={styles.helpContent}>
        {/* Sección de Novedades */}
        <View style={styles.helpSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="new-box" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Novedades</Text>
          </View>
          
          <View style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>Versión 2.0</Text>
              <Text style={styles.helpItemDescription}>
                Nuevo sistema de llamadas en cascada y soporte para WhatsApp
              </Text>
            </View>
            <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
          </View>

          <View style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>Próximamente</Text>
              <Text style={styles.helpItemDescription}>
                Historial detallado y estadísticas de llamadas
              </Text>
            </View>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#666" />
          </View>
        </View>

        {/* Sección de Preguntas Frecuentes */}
        <View style={styles.helpSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="frequently-asked-questions" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
          </View>
          
          <TouchableOpacity style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>¿Cómo funciona QRing?</Text>
              <Text style={styles.helpItemDescription}>
                Aprende los conceptos básicos de la aplicación
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>Configurar números</Text>
              <Text style={styles.helpItemDescription}>
                Guía para agregar y gestionar números de teléfono
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>Sistema de llamadas en cascada</Text>
              <Text style={styles.helpItemDescription}>
                Entiende cómo funciona el sistema de llamadas secuenciales
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>WhatsApp vs Llamada directa</Text>
              <Text style={styles.helpItemDescription}>
                Diferencias entre los tipos de llamada disponibles
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Sección de Tutoriales */}
        <View style={styles.helpSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="play-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Tutoriales</Text>
          </View>
          
          <TouchableOpacity style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>Primeros pasos</Text>
              <Text style={styles.helpItemDescription}>
                Configura tu primer timbre QR en 5 minutos
              </Text>
            </View>
            <MaterialCommunityIcons name="play" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>Configuración avanzada</Text>
              <Text style={styles.helpItemDescription}>
                Aprende a configurar múltiples números y tiempos de espera
              </Text>
            </View>
            <MaterialCommunityIcons name="play" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>Instalación del QR</Text>
              <Text style={styles.helpItemDescription}>
                Guía paso a paso para instalar tu timbre QR
              </Text>
            </View>
            <MaterialCommunityIcons name="play" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Sección de Contacto */}
        <View style={styles.helpSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="email-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Contacto</Text>
          </View>
          
          <TouchableOpacity style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>Soporte técnico</Text>
              <Text style={styles.helpItemDescription}>
                Obtén ayuda personalizada de nuestro equipo
              </Text>
            </View>
            <MaterialCommunityIcons name="email" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>Reportar un problema</Text>
              <Text style={styles.helpItemDescription}>
                Ayúdanos a mejorar la aplicación
              </Text>
            </View>
            <MaterialCommunityIcons name="bug" size={24} color="#FF3B30" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>Sugerencias</Text>
              <Text style={styles.helpItemDescription}>
                Comparte tus ideas para futuras mejoras
              </Text>
            </View>
            <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>

        {/* Sección de Información */}
        <View style={styles.helpSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Información</Text>
          </View>
          
          <View style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>Versión de la app</Text>
              <Text style={styles.helpItemDescription}>
                QRing v2.0.0
              </Text>
            </View>
            <MaterialCommunityIcons name="check-circle" size={24} color="#34C759" />
          </View>

          <TouchableOpacity style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>Términos y condiciones</Text>
              <Text style={styles.helpItemDescription}>
                Lee los términos de uso y privacidad
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpItem}>
            <View style={styles.helpItemInfo}>
              <Text style={styles.helpItemTitle}>Política de privacidad</Text>
              <Text style={styles.helpItemDescription}>
                Información sobre el manejo de tus datos
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const renderMainContent = () => {
    if (showHistory) return renderHistory();
    if (showConfig) return renderConfig();
    if (showHelp) return renderHelp();
    return renderMainScreen();
  };

  const Header = () => {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString());

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date().toLocaleTimeString());
        setCurrentDate(new Date().toLocaleDateString());
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerBackgroundQR}>
          <QRCode
            value="QRing"
            size={400}
            color="rgba(0,0,0,0.3)"
            backgroundColor="transparent"
          />
        </View>
        <LinearGradient
          colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.95)', '#ffffff']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={styles.headerContent}>
          <View style={styles.logoSection}>
            <Text style={styles.logoTextBold}>QR</Text>
            <Text style={styles.logoTextThin}>ing</Text>
          </View>
          <View style={styles.statusSection}>
            <Text style={styles.timeText}>{currentTime}</Text>
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
        </View>
        <View style={styles.headerBar} />
      </View>
    );
  };

  const handleIncomingCall = async () => {
    setIsCallActive(true);
    setCurrentCallIndex(0);
    
    // Simular llamada al número principal
    const newCall = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      type: callType,
      status: 'entrante',
      number: phoneNumbers[0]
    };
    setCallHistory([newCall, ...callHistory]);

    // Función para pasar al siguiente número
    const moveToNextNumber = (currentIndex) => {
      if (isCallActive && phoneNumbers.length > currentIndex + 1) {
        setCurrentCallIndex(currentIndex + 1);
        const nextCall = {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          type: callType,
          status: 'entrante',
          number: phoneNumbers[currentIndex + 1]
        };
        setCallHistory([nextCall, ...callHistory]);
      }
    };

    // Esperar por respuesta o DND en el número principal
    setTimeout(() => {
      if (isCallActive) {
        if (isDND) {
          // Si está en DND, pasar inmediatamente al siguiente número
          moveToNextNumber(0);
        } else {
          // Si no hay respuesta después del timeout, pasar al siguiente
          moveToNextNumber(0);
        }
      }
    }, isDND ? 0 : callTimeout * 1000);

    // Configurar los siguientes números en la cascada
    setTimeout(() => {
      if (isCallActive && phoneNumbers.length > 2) {
        moveToNextNumber(1);
      }
    }, callTimeout * 2000);
  };

  const handleCallAnswer = (answeredNumber) => {
    setIsCallActive(false);
    const answeredCall = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      type: callType,
      status: 'respondida',
      number: answeredNumber
    };
    setCallHistory([answeredCall, ...callHistory]);
  };

  const handleCallEnd = () => {
    setIsCallActive(false);
    setCurrentCallIndex(0);
  };

  const handleEditPress = (number, index) => {
    Alert.alert(
      "Editar número",
      "¿Qué deseas modificar?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Número",
          onPress: () => {
            setActivePhoneNumber(number);
            setEditingNumber(index);
            setIsEditing(true);
          }
        },
        {
          text: "Tipo de llamada",
          onPress: () => {
            Alert.alert(
              "Tipo de llamada",
              "Selecciona cómo quieres que te llamen",
              [
                {
                  text: "Cancelar",
                  style: "cancel"
                },
                {
                  text: "Llamada directa",
                  onPress: () => {
                    const newNumbers = [...phoneNumbers];
                    newNumbers[index] = {
                      number: number,
                      type: 'phone'
                    };
                    setPhoneNumbers(newNumbers);
                    savePhoneNumbers(newNumbers);
                  }
                },
                {
                  text: "WhatsApp",
                  onPress: () => {
                    const newNumbers = [...phoneNumbers];
                    newNumbers[index] = {
                      number: number,
                      type: 'whatsapp'
                    };
                    setPhoneNumbers(newNumbers);
                    savePhoneNumbers(newNumbers);
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handlePressIn = () => {
    setPressTimer(setTimeout(() => {
      setIsConnected(!isConnected);
      setPressProgress(0);
      pressAnimValue.setValue(0);
    }, 2000));

    Animated.timing(pressAnimValue, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    setPressProgress(0);
    pressAnimValue.setValue(0);
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        renderSplashScreen()
      ) : (
        <>
          {!isWizardMode && <Header />}
          <View style={{ flex: 1, marginBottom: isWizardMode ? 0 : 70 }}>
            <ScrollView 
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent}
            >
              {isWizardMode ? renderStep() : renderMainContent()}
            </ScrollView>
          </View>
          {!isWizardMode && renderBottomBar()}
          <StatusBar style="auto" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Splash Screen
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  splashBackgroundQR: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    opacity: 0.25,
  },
  splashLogoContainer: {
    alignItems: 'center',
  },
  splashInnerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  splashLogoText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#007AFF',
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 122, 255, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  splashLogoSubText: {
    fontSize: 72,
    fontWeight: '200',
    color: '#333',
    letterSpacing: -2,
  },
  splashVersion: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  splashTagline: {
    fontSize: 18,
    color: '#666',
    fontWeight: '400',
    marginTop: 5,
    letterSpacing: 0.5,
  },
  progressContainer: {
    width: '80%',
    marginTop: 60,
    alignItems: 'center',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  loadingText: {
    marginTop: 20,
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: '#f0f8ff',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  // Header
  headerContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingTop: 35,
    height: 110,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerBackgroundQR: {
    position: 'absolute',
    top: -100,
    left: '50%',
    transform: [{ translateX: -150 }],
    opacity: 0.15,
    width: 400,
    height: 400,
    zIndex: 1,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 3,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoTextBold: {
    fontSize: 36,
    fontWeight: '900',
    color: '#007AFF',
    letterSpacing: -1,
  },
  logoTextThin: {
    fontSize: 36,
    fontWeight: '200',
    color: '#333',
    letterSpacing: -1,
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    marginBottom: 4,
  },
  connected: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  disconnected: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  headerBar: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    zIndex: 3,
  },
  stepContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  stepContent: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  stepContentInstructions: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
    lineHeight: 32,
    fontWeight: '500',
  },
  instructionStep: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 40,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 70,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 28,
    backgroundColor: '#fff',
    color: '#333',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
    marginTop: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ddd',
    width: '45%',
    gap: 12,
  },
  optionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 18,
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 120,
    width: '90%',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    fontWeight: '500',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    paddingHorizontal: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 12,
    minWidth: 130,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#f0f0f0',
  },
  nextButton: {
    backgroundColor: '#007AFF',
  },
  soloButton: {
    marginLeft: 'auto',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
  },
  stampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stampText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#007AFF',
    letterSpacing: 2,
  },
  bellIcon: {
    marginHorizontal: 15,
  },
  qrBorder: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  qrFooter: {
    marginTop: 15,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  versionText: {
    color: '#007AFF',
  },
  statusContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
    height: 60,
    width: '100%',
    overflow: 'hidden', // Para que la barra de progreso no se salga
    position: 'relative', // Para posicionar la barra de progreso
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'left',
  },
  statusSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusInactive: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  statusDotInactive: {
    backgroundColor: '#FF3B30',
  },
  statusTextInactive: {
    color: '#FF3B30',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  historyList: {
    flexGrow: 0,
    height: 'auto',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyTime: {
    fontSize: 14,
    color: '#666',
  },
  historyType: {
    fontSize: 14,
    color: '#333',
  },
  historyStatus: {
    fontSize: 14,
    color: '#4CAF50',
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mainContent: {
    flex: 1,
    padding: 12,
    paddingTop: 8,
    paddingBottom: 75,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusInfo: {
    flex: 1,
  },
  statusDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  statusDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    gap: 10,
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  numbersCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  numberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    // Efecto sutil al presionar
    activeOpacity: 0.7,
  },
  numberInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  numberDetails: {
    flex: 1,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneNumber: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  priorityText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#fff0f0',
  },
  addNumberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  addNumberText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '500',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 340,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyNumber: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  historyTime: {
    fontSize: 14,
    color: '#666',
  },
  historyStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusAnswered: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  statusMissed: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  configContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  configHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  configHeaderText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  configSubText: {
    fontSize: 16,
    color: '#666',
  },
  configContent: {
    flex: 1,
  },
  configSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  configItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  configItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  configItemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timeoutSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  timeoutButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeoutButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeoutButtonTextActive: {
    color: '#fff',
  },
  orderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  orderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  historyHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyHeaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  historyDetailItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 14,
    color: '#666',
  },
  historyItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyNumber: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  historyStatus: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusAnswered: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  statusMissed: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  historyStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  emptyHistory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noHistoryText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  helpContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  helpHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpHeaderText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  helpSubText: {
    fontSize: 16,
    color: '#666',
  },
  helpContent: {
    flex: 1,
  },
  helpSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  helpItemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statusDotConnected: {
    backgroundColor: '#34C759',
  },
  statusDotDisconnected: {
    backgroundColor: '#FF3B30',
  },
  statusTextConnected: {
    color: '#34C759',
  },
  statusTextDisconnected: {
    color: '#FF3B30',
  },
  pressProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  numberWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  numberTypeIcon: {
    marginLeft: 4,
  },
  timeoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeoutText: {
    fontSize: 12,
    color: '#666',
  },
});
