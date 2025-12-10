import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    StatusBar
} from 'react-native';
// Importar ícones do Material Design
import Icon from 'react-native-vector-icons/MaterialIcons';

const MainScreen = ({ navigation }) => {

    // Função auxiliar para renderizar um botão personalizado
    const renderCustomButton = (title, routeName, iconName, bgColor, pressedColor) => (
        <Pressable
            onPress={() => navigation.navigate(routeName)}
            // O style do Pressable recebe uma função que nos diz se está a ser pressionado ou não
            style={({ pressed }) => [
                styles.buttonContainer,
                { backgroundColor: pressed ? pressedColor : bgColor }, // Muda a cor ao carregar
                pressed && styles.buttonPressed // Adiciona efeito de escala/opacidade
            ]}
        >
            <Icon name={iconName} size={24} color="white" style={styles.icon} />
            <Text style={styles.buttonText}>{title}</Text>
            <Icon name="chevron-right" size={24} color="rgba(255,255,255,0.5)" style={styles.chevron} />
        </Pressable>
    );

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />

            {/* Header Area */}
            <View style={styles.headerContainer}>
                <Text style={styles.welcomeTitle}>Bem-vindo ao DSSMV</Text>
                <Text style={styles.welcomeSubtitle}>Gerencie a sua biblioteca e utilizadores.</Text>
            </View>

            {/* Actions Area */}
            <View style={styles.actionsContainer}>
                {/* Botão Bibliotecas (Azul) */}
                {renderCustomButton(
                    "Ver Bibliotecas",
                    "Libraries",
                    "local-library", // Nome do ícone
                    "#0066CC",       // Cor normal
                    "#0052a3"        // Cor ao pressionar (mais escura)
                )}

                {/* Botão Utilizadores (Verde/Azulado) */}
                {renderCustomButton(
                    "Ver Utilizadores",
                    "Users",
                    "people",        // Nome do ícone
                    "#00A896",       // Cor normal
                    "#008f80"        // Cor ao pressionar
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f5f7fa', // Um cinza muito claro, quase branco, para o fundo
        padding: 24,
    },
    headerContainer: {
        marginTop: 60,
        marginBottom: 40,
        alignItems: 'flex-start',
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#666',
    },
    actionsContainer: {
        flex: 1,
        justifyContent: 'center',
        gap: 20, // Espaço entre os botões (funciona em RN moderno)
    },
    // Estilos dos Botões
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16, // Bordas bem arredondadas
        width: '100%',
        // Sombras suaves
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 6,
    },
    buttonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }] // Ligeiro efeito de "encolher" ao clicar
    },
    icon: {
        marginRight: 16,
    },
    buttonText: {
        flex: 1, // Ocupa o espaço disponível
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    chevron: {
        marginLeft: 8,
    }
});

export default MainScreen;