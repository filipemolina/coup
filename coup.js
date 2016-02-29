Jogos = new Mongo.Collection('jogos');
Cartas = new Mongo.Collection('cartas');

//////////////////////////////////////////////////////////////// Variáveis Globais

posicoes_moeda = [];
posicoes_moeda[0] = { top : '80px', left : '50%' };
posicoes_moeda[1] = { top : '255px', left : '50%' };
posicoes_moeda[2] = { top : '210px', left : '430px' };
posicoes_moeda[3] = { top : '230px', left : '950px' };
posicoes_moeda[4] = { top : '80px', left : '220px' };
posicoes_moeda[5] = { top : '80px', left : '1110px' };

cont = 0;


//////////////////////////////////////////////////////////////// Funções Globais

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function meuJogador(jogo, username)
{
    return jogo.jogadores.filter(function(obj){
        return obj.nome == username;
    })[0];
}

function minhaVez(username)
{
    var jogo = Jogos.findOne(Session.get('partida'));

    var minha_posicao = meuJogador(jogo, username).posicao;

    if(minha_posicao == jogo.jogador_atual)
    {
        return true;
    }
    else
    {
        return false;
    }
}

function ganharMoeda(jogador){

    // Ajustar a quantidade de moedas

    if(!jogador.moedas)
        jogador.moedas = 1;
    else
        jogador.moedas++;

    return jogador;

}

function animarMoeda(moeda)
{
    moeda = Jogos.findOne(Session.get('partida')).moeda;

    $("div.partida .moeda").css({ 'top' : moeda.origem.top, 'left' : moeda.origem.left });
    
    $("div.partida .moeda").animate({
        top : moeda.destino.top,
        left : moeda.destino.left
    }, 700, function(){

        $("div.partida .moeda").css({ 'top' : posicoes_moeda[0].top, 'left' : posicoes_moeda[0].left });    

        cont++;

        if(cont < moeda.qtd)
            animarMoeda(moeda);
        else
            cont = 0;
    });

}

function passarAVez(jogo)
{
    var qtd = jogo.jogadores.length;

    jogo.jogador_atual++;

    if(jogo.jogador_atual > qtd)
        jogo.jogador_atual = 1;

    return jogo;
}

// Lista de cartas

if (Meteor.isClient) {

  //////////////////////////////////////////////////////////////// Template : Body

  Template.body.created = function()
  {
    // Setar a variável de seção das telas
    Session.setDefault('tela', 'menu');

    // Tocar a música de fundo

    // myAudio = new Audio('sound/bg.mp3'); 
    // myAudio.addEventListener('ended', function() {
    //     this.currentTime = 0;
    //     this.play();
    // }, false);
    // myAudio.play();
  }
  
  Template.body.helpers({

    ////////////////////////////// Helpers de Nagegação

    estaNoMenuPrincipal : function()
    {
      return Session.get('tela') == 'menu';
    },

    estaNaTelaCriarJogo : function() {
      return Session.get('tela') == 'criarJogo';
    },

    estaNaPartida : function() {
      return Session.get('tela') == 'partida';
    },

    ////////////////////////////// 
  });

  //////////////////////////////////////////////////////////////// Template : Menu Principal

  Template.menuPrincipal.events({
    
    'click button.btn-criar' : function (){

        Session.set('tela', 'criarJogo');

    },

    'click button.deletar' : function() {

      Meteor.call('deletarJogo', this._id);

    },

    'click .jogo a' : function(event){

      event.preventDefault();

      var estaJogando = false;

      // Obter os jogadores desta partida

      var jogadores = this.jogadores;


      // Verificar se o jogador já está jogando esta partida

      for(i = 0; i < this.jogadores.length; i++)
      {

        if(this.jogadores[i].nome == Meteor.user().username)
        {
          estaJogando = true;
        }
      }

      // Caso ainda não esteja, adicioná-lo à partida

      if(!estaJogando)
      {

        var proximaPosicao = this.jogadores.length + 1;

        this.jogadores.push(

          {
              nome : Meteor.user().username,
              cartas : [
                {
                  id : '',
                  tipo : '',
                  img : '',
                  revelada : 0
                },
                {
                  id : '',
                  tipo : '',
                  img : '',
                  revelada : 0
                }
              ],
              moeadas : 0,
              status : 1,
              posicao : proximaPosicao,
              minha_vez : 0,
            }

        );
      }

      // Redirecionar o Jogador para a partida

      Session.set('tela', 'partida');
      Session.set('partida', this._id);

      // Salvar 

      Meteor.call('alterarJogo', this);

      // Testar se o número de jogadores já foi alcançado e iniciar a partida

      if(this.jogadores.length == this.num_jogadores)
      {
        this.status = 'iniciado';

        // Iniciar a partida apenas se este jogador não estiver jogando

        if(!estaJogando)
        {
          Meteor.call('iniciarJogo', this);
        }
      }

    }

  });

  Template.menuPrincipal.helpers({

    jogos : function(){
      return Jogos.find({ $or: [ { status: 'criado' }, { status : 'iniciado' } ] });
    }

  });

  //////////////////////////////////////////////////////////////// Template : Jogo

  Template.jogo.helpers({

    eDono : function(id_criador){

      if(id_criador == Meteor.userId())
        return true;
      else
        return false;

    }

  });

  //////////////////////////////////////////////////////////////// Template : Criar Novo Jogo

  Template.criarJogo.events({

    'click button.voltar' : function(event) {

        event.preventDefault();

        Session.set('tela', 'menu');

    },

    'submit #form-criar-jogo' : function(event) {

      event.preventDefault();

      var jogo = {
        nome : event.target.nome.value,
        numero_jogadores : event.target.numero_jogadores.value
      };

      Meteor.call('criarJogo', jogo);

      event.target.nome.value = '';

      Session.set('tela', 'menu');

    }

  });

  //////////////////////////////////////////////////////////////// Template : Partida

    Template.partida.created = function(){

        var partida_id = Session.get('partida');

        ////////////////////////////////////////////////////// Observar Mudanças

        // Essa função observa todas as mudanças no objeto do Jogo e realiza as ações necessárias na tela

        Jogos.find().observeChanges({

            changed : function(id, fields){

                // Caso as informações da moeda tenham mudado

                if(fields.moeda)
                {
                    animarMoeda(fields.moeda);
                }

            }

        });

    };

    Template.partida.helpers({

      id_partida : function(){

          return Session.get('partida');

      },

      jogadores : function(){

          var id_partida = Session.get('partida');

          return Jogos.findOne(id_partida).jogadores;

      },

      minha_vez : function(){

        return minhaVez(Meteor.user().username);

      }

    });

    Template.partida.events({

        ///////////////////////////////////////////////////////////////////// Realizar a ação de Renda

        // Evitar que um jogador clique múltiplas vezes nesse botão

        'click .botao.renda a' : function(event){

            event.preventDefault();

            // Obter a partida

            var id_partida = Session.get('partida');

            var jogo = Jogos.findOne(id_partida);

            // Aumentar a quantidade de Moedas

            var player = meuJogador(jogo, Meteor.user().username);

            player = ganharMoeda(player);

            // Animar a moeda

            jogo.moeda.origem = posicoes_moeda[0];
            jogo.moeda.destino = posicoes_moeda[player.posicao];
            jogo.moeda.qtd = 3;

            // Setar as informações da Ação

            jogo.acao_atual.tipo = 'renda';
            jogo.acao_atual.executor = Meteor.user().username;

            // Salvar

            Meteor.call('alterarJogo', jogo);

            // Passar a vez para o próximo jogador

            setTimeout(function(){
                jogo = passarAVez(jogo);
                Meteor.call('alterarJogo', jogo);
            }, jogo.moeda.qtd * 700);

        }

    });

  //////////////////////////////////////////////////////////////// Template : Jogador

  Template.jogador.helpers({

        minhas_cartas : function(){

            var meu_nome = Template.parentData().nome;

            if(meu_nome == Meteor.user().username)
                return true;
            else
                return false;

        },

        meu_turno : function(username){

            return minhaVez(username);

        }

  });

  //////////////////////////////////////////////////////////////// Configurar a tela de login

  Accounts.ui.config({
    passwordSignupFields : "USERNAME_ONLY",
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

Meteor.methods({

  ////////////////////////////// Jogos

  criarJogo : function(jogo){

    // Verificar se o usuários está logado antes de proceder com a criação

    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    // Criar o novo jogo no banco de dados

    var novoJogo = Jogos.insert({

      nome : jogo.nome,
      num_jogadores : jogo.numero_jogadores,
      id_criador : Meteor.userId(),
      nome_criador : Meteor.user().username,
      status : 'criado',
      jogadores : [
        {
          nome : Meteor.user().username,
          cartas : [
            {
              id : '',
              tipo : '',
              img : '',
              revelada : 0
            },
            {
              id : '',
              tipo : '',
              img : '',
              revelada : 0
            }
          ],
          moeadas : 0,
          status : 1,
          posicao : 1,
          minha_vez : 0,
        }
      ],
      cartasUsadas : [],
      cartasDispoiveis : [],
      jogador_atual : '',
      acao_atual : {

        tipo : '',
        executor : '',
        confirmacao : 0,
        contestada : 0,
        mensagem_privada : '',
        mensagem_publica : ''   

      },
      moeda : {
        origem :{
            top : '',
            'left' : ''
        },
        destino : {
            top : '',
            left : ''
        },
        qtd : 0

      }

    });

    // Gravar o Id da partida no jogador para futuras consutas

    var ultimoJogo = Jogos.findOne(novoJogo);

    ultimoJogo.jogadores[0].id_partida = novoJogo;

    Jogos.update(novoJogo, ultimoJogo);

  },

  deletarJogo : function(jogo){

    // Verificar se o usuários está logado antes de proceder

    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }


    Jogos.remove(jogo);

  },

  alterarJogo : function(jogo){

    // Verificar se o usuários está logado antes de proceder

    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Jogos.update(jogo._id, jogo);

  },

  iniciarJogo : function(jogo){

    // Verificar se o usuários está logado antes de proceder

    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    
    // Inserir todas as cartas no vetor de cartas disponíveis para essa partida

    var cartas = Cartas.find({}).fetch();

    for(i=0; i < cartas.length; i++)
    {
      jogo.cartasDispoiveis.push({ id : cartas[i]._id, tipo : cartas[i].tipo });
    }

    // Embaralhar o Deck

    shuffle(jogo.cartasDispoiveis);

    // Distribuir 2 cartas aleatórias para cada jogador

    for(i=0; i < jogo.jogadores.length; i++)
    {

      // Primeira carta

      jogo.jogadores[i].cartas[0].id = jogo.cartasDispoiveis[0].id;
      jogo.jogadores[i].cartas[0].tipo = jogo.cartasDispoiveis[0].tipo;

      // Segunda Carta

      jogo.jogadores[i].cartas[1].id = jogo.cartasDispoiveis[1].id;
      jogo.jogadores[i].cartas[1].tipo = jogo.cartasDispoiveis[1].tipo;      

      // Remover as cartas utilizadas

      jogo.cartasDispoiveis.shift();
      jogo.cartasDispoiveis.shift();

    }

    // Definir o jogador atual

    jogo.jogadores[0].minha_vez = 1;
    jogo.jogador_atual = 1;

    Meteor.call('alterarJogo', jogo);

  }

});
