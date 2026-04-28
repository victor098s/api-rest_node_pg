// =============================================
// script.js — Lógica do Front-end
// Comunicação com a API REST de Produtos
// =============================================

// ─── VARIÁVEL GLOBAL ─────────────────────────
// Guarda o ID do produtos sendo editado.
// null = modo cadastro (novo produto)
// número = modo edição (produto existente)
// Esta variável é consultada no submit do formulário
// para decidir se chama criarProduto() ou atualizarProduto()
let produtoEmEdicao = null;

// ═════════════════════════════════════════════
// SEÇÃO 1: FUNÇÕES AUXILIARES
// ─────────────────────────────────────────────
// Estas funções são ferramentas de apoio usadas
// pelas demais seções. Não chamam a API diretamente.
// Incluem: exibir modal de feedback, limpar formulário
// e formatar dados para exibição (Preço, Estoque, Categoria).
// ═════════════════════════════════════════════

/**
 * Exibe um modal (janela flutuante) com uma mensagem de feedback ao usuário.
 * É chamada após cada operação (criar, editar, deletar) para informar
 * se a ação foi bem-sucedida ou se ocorreu um erro.
 * @param {string} mensagem - Texto a ser exibido no modal
 * @param {string} tipo - 'sucesso' | 'erro' | 'info'
 */
function mostrarMensagem(mensagem, tipo = "info") {
  const modal = document.getElementById("modalMessage");
  const modalText = document.getElementById("modalText");
  // Define o texto e torna o modal visível (estava display:none no CSS)
  modalText.textContent = mensagem;
  modal.style.display = "flex";
}

/**
 * Fecha o modal de mensagens.
 * Chamada pelo botão "Fechar" dentro do modal no index.html:
 * <button onclick="fecharModal()">Fechar</button>
 */
function fecharModal() {
  document.getElementById("modalMessage").style.display = "none";
}

/**
 * Limpa todos os campos do formulário e reseta o estado de edição.
 * Após limpar, o sistema volta ao modo de cadastro (novo produto).
 */
function limparFormulario() {
  // .reset() é um método nativo do HTML que limpa todos os inputs do form
  document.getElementById("productForm").reset();
  // Reseta a variável global para indicar que não há edição em andamento
  produtoEmEdicao = null;
  // Restaura o título original da seção do formulário
  document.querySelector(".form-section h2").textContent =
    "Adicionar ou Editar Produto";
}

/**
 * Formata Preço para exibição: "12345678901" → "123.456.789-01"
 * A regex usa 4 grupos de captura para dividir os dígitos:
 *   (\d{3}) → 3 dígitos  →  "123"
 *   (\d{3}) → 3 dígitos  →  "456"
 *   (\d{3}) → 3 dígitos  →  "789"
 *   (\d{2}) → 2 dígitos  →  "01"
 * O padrão '$1.$2.$3-$4' reconstrói como: 123.456.789-01
 */

/**
 * Formata estoque para exibição: "11999998888" → "(11) 99999-8888"
 * \d{4,5} captura 4 ou 5 dígitos, cobrindo estoque fixo e celular.
 */

/**
 * Formata data do banco (YYYY-MM-DD) para exibição (DD/MM/YYYY).
 * O PostgreSQL retorna datas no formato ISO: "1990-05-25T00:00:00.000Z"
 * Usamos substring(0,10) para pegar apenas a parte da data: "1990-05-25"
 * Em seguida, split('-') divide em array: ["1990", "05", "25"]
 * Por fim, remontamos na ordem brasileira: "25/05/1990"
 */
function formatarData(data) {
  if (!data) return "";
  const [ano, mes, dia] = data.substring(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/**
 * Escapa aspas simples em strings para uso seguro dentro de onclick="...".
 * IMPORTANTE: quando um nome ou endereço contém apóstrofo (ex: "D'avila"),
 * o HTML do botão Editar quebraria sem este tratamento, pois a aspa simples
 * fecharia prematuramente o atributo onclick.
 * Esta função substitui ' por \' para que o HTML seja válido.
 * @param {string} valor - String a ser escapada
 * @returns {string} String com aspas simples escapadas
 */
function escaparAspa(valor) {
  if (!valor) return "";
  return String(valor).replace(/'/g, "\\'");
}

// ═════════════════════════════════════════════
// SEÇÃO 2: OPERAÇÕES COM A API (CRUD)
// ─────────────────────────────────────────────
// Esta é a seção principal do script. Aqui ficam
// as funções que se comunicam diretamente com o
// back-end usando fetch(). Cada função representa
// uma operação do CRUD:
//   carregarProdutos() → GET  /produtos      (Read - listar todos)
//   criarProduto()     → POST /produtos       (Create)
//   atualizarProduto() → PUT  /produtos/:id   (Update)
//   deletarProduto()   → DELETE /produtos/:id (Delete)
//
// Todas são funções assíncronas (async/await) e usam
// try/catch para tratar erros de rede ou do servidor.
// ═════════════════════════════════════════════

/**
 * GET /produtos
 * Busca TODOS os produtos da API e exibe na tabela.
 * Esta função é chamada automaticamente ao carregar a página
 * e também pelo botão "Recarregar Lista".
 *
 * Fluxo de execução:
 *  1. Exibe "Carregando..." e limpa a tabela anterior
 *  2. Faz fetch GET para /produtos
 *  3. Se der certo: exibe a tabela com os dados
 *  4. Se der errado: exibe mensagem de erro
 */
async function carregarProdutos() {
  // Captura os três elementos de controle visual da seção de listagem
  const loadingMessage = document.getElementById("loadingMessage");
  const emptyMessage = document.getElementById("emptyMessage");
  const productsList = document.getElementById("productsList");

  // Estado inicial: mostra "Carregando..." e limpa conteúdo anterior
  loadingMessage.style.display = "block";
  emptyMessage.style.display = "none";
  productsList.innerHTML = "";

  try {
    // Envia GET para /products — sem body, sem headers especiais
    const resposta = await fetch("http://localhost:3000/produtos");

    // resposta.ok é true para status 200-299, false para 400, 500, etc.
    if (!resposta.ok) throw new Error("Erro ao buscar produtos");

    // .json() lê o corpo da resposta e converte o texto JSON em array JS
    const produtos = await resposta.json();

    // Oculta o "Carregando..." agora que temos a resposta
    loadingMessage.style.display = "none";

    if (produtos.length === 0) {
      // API retornou array vazio: não há produtos cadastrados
      emptyMessage.style.display = "block";
    } else {
      // API retornou dados: monta a tabela HTML
      exibirTabela(produtos);
    }
  } catch (erro) {
    // Qualquer erro de rede ou do servidor cai aqui
    loadingMessage.style.display = "none";
    emptyMessage.style.display = "block";
    console.error("Erro ao carregar produtos:", erro);
    mostrarMensagem(
      "Erro ao carregar produtos. Verifique se o servidor está rodando.",
      "erro",
    );
  }
}

/**
 * POST /produtos
 * Cria um novo produto enviando todos os campos como JSON no corpo.
 * Chamada pelo submit do formulário quando produtoEmEdicao === null.
 *
 * @param {Object} dados - Objeto com todos os campos do produto
 *
 * Diferença para o GET:
 *  - Usa method: 'POST'
 *  - Inclui headers com Content-Type: application/json
 *  - Inclui body com os dados convertidos por JSON.stringify()
 */
async function criarProduto(dados) {
  try {
    const resposta = await fetch("http://localhost:3000/produtos", {
      method: "POST",
      headers: {
        // Informa ao servidor que o corpo está em formato JSON
        // Sem isso, o express.json() não sabe como interpretar o body
        "Content-Type": "application/json",
      },
      // JSON.stringify converte o objeto JS para texto JSON antes de enviar
      // Ex: { nome: "João" } → '{"nome":"João"}'
      body: JSON.stringify(dados),
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.error || "Erro ao criar produto");
    }

    mostrarMensagem("Produto cadastrado com sucesso!", "sucesso");
    limparFormulario(); // Limpa o formulário para um próximo cadastro
    carregarProdutos(); // Atualiza a tabela para mostrar o novo registro
  } catch (erro) {
    console.error("Erro ao criar produto:", erro);
    mostrarMensagem("Erro: " + erro.message, "erro");
  }
}

/**
 * PUT /produtos/:id
 * Atualiza os dados de um produto existente.
 * Chamada pelo submit do formulário quando produtoEmEdicao tem um ID.
 *
 * @param {number} id    - ID do produto a ser atualizado (vai na URL)
 * @param {Object} dados - Novos dados do produto (vão no body)
 *
 * Diferença para o POST:
 *  - Usa method: 'PUT'
 *  - O ID vai na URL: /produtos/5  (não no body)
 *  - O body contém apenas os dados a atualizar
 */
async function atualizarProduto(id, dados) {
  try {
    // Template literal monta a URL com o ID: /produtos/5
    const resposta = await fetch(`http://localhost:3000/produtos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.error || "Erro ao atualizar produto");
    }

    mostrarMensagem("Produto atualizado com sucesso!", "sucesso");
    limparFormulario(); // Sai do modo de edição
    carregarProdutos(); // Atualiza a tabela com os dados novos
  } catch (erro) {
    console.error("Erro ao atualizar produto:", erro);
    mostrarMensagem("Erro: " + erro.message, "erro");
  }
}

/**
 * DELETE /produtos/:id
 * Remove permanentemente um produto após confirmação do usuário.
 * Chamada pelo botão "Deletar" de cada linha da tabela.
 *
 * @param {number} id - ID do produto a ser deletado
 *
 * Diferença para os outros métodos:
 *  - Usa method: 'DELETE'
 *  - Não tem body nem headers especiais
 *  - O ID vai apenas na URL: /produtos/5
 */
async function deletarProduto(id) {
  // confirm() exibe uma caixa de diálogo nativa do navegador.
  // Se o usuário clicar em "Cancelar", a função termina aqui (return).
  if (!confirm("Tem certeza que deseja deletar este produto?")) return;

  try {
    const resposta = await fetch(`http://localhost:3000/produtos/${id}`, {
      method: "DELETE",
      // DELETE não precisa de body nem Content-Type
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.error || "Erro ao deletar produto");
    }

    mostrarMensagem("Produto removido com sucesso!", "sucesso");
    carregarProdutos(); // Recarrega a tabela sem o registro deletado
  } catch (erro) {
    console.error("Erro ao deletar produto:", erro);
    mostrarMensagem("Erro: " + erro.message, "erro");
  }
}

// ═════════════════════════════════════════════
// SEÇÃO 3: EXIBIÇÃO DOS DADOS
// ─────────────────────────────────────────────
// Esta seção cuida da interface visual dos dados.
// Contém duas funções:
//   exibirTabela()   → recebe o array de produtos e monta
//                      dinamicamente a tabela HTML na página
//   editarProduto()  → preenche o formulário com os dados
//                      de um produto para edição
//
// Aqui o JavaScript age como um "montador de HTML":
// lê os dados do objeto JSON e os injeta no DOM da página.
// ═════════════════════════════════════════════

/**
 * Gera e insere a tabela HTML com a lista de produtos recebida da API.
 * Usa template literals (crases ``) para montar o HTML como texto
 * e depois atribui ao innerHTML do container.
 *
 * @param {Array} produtos - Array de objetos produto vindos da API
 *
 * Para cada produto do array, esta função:
 *  1. Formata os dados para exibição (Preço, estoque, data)
 *  2. Monta o endereço completo em uma única string
 *  3. Cria uma linha <tr> com botões de Editar e Deletar
 *  4. Insere tudo no div#ProductsList do HTML
 */
function exibirTabela(produtos) {
  const productsList = document.getElementById("productsList");

  // Começa montando o HTML da tabela (cabeçalho fixo)
  let html = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Preço</th>
          <th>Estoque</th>
          <th>Categoria</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Percorre o array e adiciona uma linha por produto
  produtos.forEach((produto) => {
    // Monta o endereço completo juntando os campos em uma única string.
    // filter(Boolean) remove valores null, undefined ou string vazia

    // para não aparecer vírgulas soltas quando 'casa' for nulo.
 
 // Resultado: "Av. Paulista, 1000, Apto 5, Bela Vista"

    // escaparAspa() protege os valores dos campos contra apóstrofos
    // que quebrariam o onclick="editarProduto('D'avila', ...)"
    html += `
      <tr>
        <td>#${produto.id}</td>
        <td>${produto.nome}</td>
        <td>${produto.preco}</td>
        <td>${produto.estoque}</td>
        <td>${produto.categoria}</td>
        <td>${formatarData(produto.criado_em)}</td>
        <td class="acoes">
          <button class="btn btn-edit"
            onclick="editarProduto(
              ${produto.id},
              '${escaparAspa(produto.nome)}',
              '${escaparAspa(produto.preco)}',
              '${escaparAspa(produto.estoque)}',
              '${escaparAspa(produto.categoria)}',
              '${produto.criado_em ? produto.criado_em.substring(0, 10) : ""}',
            )">
            ✏️ Editar
          </button>
          <button class="btn btn-danger"
            onclick="deletarProduto(${produto.id})">
            🗑 Deletar
          </button>
        </td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  // Injeta todo o HTML gerado no container da tabela na página
  productsList.innerHTML = html;
}

/**
 * Preenche o formulário com os dados do produto selecionado para edição.
 * Chamada pelo botão "Editar" de cada linha, gerado em exibirTabela().
 *
 * Recebe todos os campos como parâmetros individuais porque são passados
 * diretamente pelo atributo onclick="" do botão no HTML gerado.
 */
function editarProduto(
  id,
  nome,
  preco,
  estoque,
  categoria,

) {
  // Grava o ID na variável global para que o submit do formulário saiba
  // que deve chamar atualizarProduto() e não criarProduto()
  produtoEmEdicao = id;

  // Preenche cada campo do formulário com os dados recebidos
  document.getElementById("nome").value = nome;
  document.getElementById("preco").value = preco;
  document.getElementById("estoque").value = estoque;
  document.getElementById("categoria").value = categoria;


  // Altera o título da seção do formulário para deixar claro que é uma edição
  document.querySelector(".form-section h2").textContent =
    `Editando Produto #${id}`;

  // Rola a página suavemente até o formulário para o usuário ver o que aconteceu
  document
    .querySelector(".form-section")
    .scrollIntoView({ behavior: "smooth" });
}

// ═════════════════════════════════════════════
// SEÇÃO 4: BUSCA E FILTRO
// ─────────────────────────────────────────────
// Esta seção gerencia a funcionalidade de pesquisa.
// Contém duas funções:
//   buscarProduto()  → faz o fetch para as rotas de busca
//                       do back-end (/produtos/nome/:nome
//                       ou /produtos/:id) e exibe os resultados
//   filtrarProduto() → lê os campos do formulário de busca
//                       e decide qual tipo de busca executar
//
// A busca sempre ocorre no back-end (server-side), não no
// array em memória, para garantir resultados precisos mesmo
// com grandes volumes de dados.
// ═════════════════════════════════════════════

/**
 * Envia uma requisição de busca ao back-end e exibe os resultados.
 * Suporta dois tipos de busca, conforme a rota da API:
 *   tipo 'nome' → GET /produtos/nome/:nome  (retorna array)
 *   tipo 'id'   → GET /produtos/:id          (retorna objeto único)
 *
 * @param {string} tipo  - 'nome' ou 'id'
 * @param {string} valor - Valor digitado no campo de busca
 */
async function buscarProdutos(tipo, valor) {
  // Reutiliza os mesmos elementos de controle visual de carregarProdutos()
  const loadingMessage = document.getElementById("loadingMessage");
  const emptyMessage = document.getElementById("emptyMessage");
  const productsList = document.getElementById("productsList");

  loadingMessage.style.display = "block";
  emptyMessage.style.display = "none";
  productsList.innerHTML = "";

  try {
    // Monta a URL correta de acordo com o tipo de busca selecionado
    let url = "";
    if (tipo === "nome") {
      // encodeURIComponent converte caracteres especiais para URL segura
      // Ex: "João Silva" → "Jo%C3%A3o%20Silva"
      url = `http://localhost:3000/produtos/nome/${encodeURIComponent(valor)}`;
    } else if (tipo === "id") {
      // Busca pelo ID numérico diretamente na rota /:id
      url = `http://localhost:3000/produtos/${valor}`;
    }

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error("Erro na busca");

    let produtos = await resposta.json();

    // Normalização: a rota /produtos/:id retorna um objeto único {},
    // enquanto /produtos/nome/:nome retorna um array [].
    // Convertemos sempre para array para poder usar exibirTabela()
    // da mesma forma nos dois casos.
    if (!Array.isArray(produtos)) {
      produtos = produtos ? [produtos] : [];
    }

    loadingMessage.style.display = "none";

    if (produtos.length === 0) {
      emptyMessage.style.display = "block";
      emptyMessage.textContent = "Nenhum produto encontrado para essa busca.";
    } else {
      exibirTabela(produtos);
    }
  } catch (erro) {
    loadingMessage.style.display = "none";
    emptyMessage.style.display = "block";
    console.error("Erro na busca:", erro);
    mostrarMensagem("Erro ao buscar produtos.", "erro");
  }
}

/**
 * Lê os valores do formulário de busca e decide o que fazer.
 * Chamada pelo botão "Buscar" e pela tecla Enter no campo de texto.
 *
 * Se o campo estiver vazio → recarrega todos os produtos
 * Se houver texto         → chama buscarProdutos() com tipo e valor
 */
function filtrarProdutos() {
  const valor = document.getElementById("searchInput").value.trim();
  const tipo = document.getElementById("searchType").value; // 'nome' ou 'id'

  if (valor === "") {
    // Campo vazio = o usuário limpou a busca, volta para a lista completa
    carregarProdutos();
  } else {
    buscarProdutos(tipo, valor);
  }
}

// ═════════════════════════════════════════════
// SEÇÃO 5: EVENT LISTENERS
// ─────────────────────────────────────────────
// Esta é a seção que "liga" o HTML ao JavaScript.
// Event Listeners são "escutadores de eventos":
// aguardam que o usuário faça algo (clicar em um botão,
// enviar um formulário, pressionar uma tecla) e então
// executam a função correspondente.
//
// IMPORTANTE: todo o código desta seção fica dentro de
// DOMContentLoaded, que garante que o HTML esteja 100%
// carregado antes de tentar acessar os elementos pelo id.
// Sem isso, getElementById() poderia retornar null.
// ═════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", function () {
  // ─── Carregamento inicial ─────────────────
  // Assim que a página termina de carregar, busca e exibe os produtos
  carregarProdutos();

  // ─── Submit do formulário ─────────────────
  // Intercepta o envio do formulário para tratar via JavaScript
  // em vez de recarregar a página (comportamento padrão do HTML)
  document
    .getElementById("productForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault(); // Cancela o recarregamento padrão da página

      // Coleta os valores de todos os campos do formulário
      const dados = {
        nome: document.getElementById("nome").value.trim(),
        preco: document.getElementById("preco").value.trim(),
        estoque: document.getElementById("estoque").value.trim(),
        categoria: document.getElementById("categoria").value.trim(),

      };

      // A variável global produtoEmEdicao decide a operação:
      // Se tiver um ID → é uma edição → chama PUT
      // Se for null    → é um cadastro novo → chama POST
      if (produtoEmEdicao) {
        atualizarProduto(produtoEmEdicao, dados);
      } else {
        criarProduto(dados);
      }
    });

  // ─── Botão Limpar ─────────────────────────
  // Limpa todos os campos e volta ao modo de cadastro
  document
    .getElementById("btnLimpar")
    .addEventListener("click", limparFormulario);

  // ─── Botão Recarregar ─────────────────────
  // Refaz o GET /produtos e atualiza a tabela completa
  document
    .getElementById("btnRecarregar")
    .addEventListener("click", carregarProdutos);

  // ─── Botão Buscar ─────────────────────────
  // Lê o campo de busca e envia para o back-end
  document
    .getElementById("btnBuscar")
    .addEventListener("click", filtrarProdutos);

  // ─── Tecla Enter no campo de busca ────────
  // Permite buscar pressionando Enter, sem precisar clicar no botão
  document
    .getElementById("searchInput")
    .addEventListener("keyup", function (e) {
      if (e.key === "Enter") filtrarProdutos();
    });

  // ─── Fechar modal ao clicar fora ──────────
  // Se o usuário clicar no fundo escuro (overlay) do modal,
  // fecha o modal. e.target é o elemento que foi clicado;
  // 'this' é o próprio modal. Se forem iguais, clicou no fundo.
  document
    .getElementById("modalMessage")
    .addEventListener("click", function (e) {
      if (e.target === this) fecharModal();
    });
}); // Fim do DOMContentLoaded
