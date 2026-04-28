let produtoEmEdicao = null;


function mostrarMensagem(mensagem, tipo = "info") {
  const modal = document.getElementById("modalMessage");
  const modalText = document.getElementById("modalText");
  modalText.textContent = mensagem;
  modal.style.display = "flex";
}

function fecharModal() {
  document.getElementById("modalMessage").style.display = "none";
}

function limparFormulario() {
  document.getElementById("ProdutoForm").reset();
  produtoEmEdicao = null;
  document.querySelector(".form-section h2").textContent =
    "Adicionar ou Editar Produtos";
}

function formatarPreco(preco) {
  if (isNaN(preco)) {
    alert("O preço precisa ser um número válido");
  }
  return preco;
}

function formatarEstoque(estoque) {
  if (isNaN(estoque)) {
    alert("O estoque precisa ser um número válido");
  }
  return estoque;
}

function formatarData(data) {
  if (!data) return "";
  const [ano, mes, dia] = data.substring(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function escaparAspa(valor) {
  if (!valor) return "";
  return String(valor).replace(/'/g, "\\'");
}

// ═════════════════════════════════════════════
// SEÇÃO 2: OPERAÇÕES COM A API (CRUD)
// ═════════════════════════════════════════════

async function carregarProdutos() {
  const loadingMessage = document.getElementById("loadingMessage");
  const emptyMessage = document.getElementById("emptyMessage");
  const lista = document.getElementById("produtoList");

  loadingMessage.style.display = "block";
  emptyMessage.style.display = "none";
  lista.innerHTML = "";

  try {
    const resposta = await fetch("http://localhost:3000/produtos");
    if (!resposta.ok) throw new Error("Erro ao buscar produtos");

    const produtos = await resposta.json();

    loadingMessage.style.display = "none";

    if (produtos.length === 0) {
      emptyMessage.style.display = "block";
    } else {
      exibirTabela(produtos);
    }
  } catch (erro) {
    loadingMessage.style.display = "none";
    emptyMessage.style.display = "block";
    console.error("Erro ao carregar produtos:", erro);
    mostrarMensagem("Erro ao carregar produtos.", "erro");
  }
}

async function criarProduto(dados) {
  try {
    const resposta = await fetch("http://localhost:3000/produtos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.error || "Erro ao criar produto");
    }

    mostrarMensagem("Produto cadastrado com sucesso!", "sucesso");
    limparFormulario();
    carregarProdutos();
  } catch (erro) {
    console.error("Erro ao criar produto:", erro);
    mostrarMensagem("Erro: " + erro.message, "erro");
  }
}

async function atualizarProduto(id, dados) {
  try {
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
    limparFormulario();
    carregarProdutos();
  } catch (erro) {
    console.error("Erro ao atualizar produto:", erro);
    mostrarMensagem("Erro: " + erro.message, "erro");
  }
}

async function deletarProduto(id) {
  if (!confirm("Tem certeza que deseja deletar este produto?")) return;

  try {
    const resposta = await fetch(`http://localhost:3000/produtos/${id}`, {
      method: "DELETE",
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.error || "Erro ao deletar produto");
    }

    mostrarMensagem("Produto removido com sucesso!", "sucesso");
    carregarProdutos();
  } catch (erro) {
    console.error("Erro ao deletar produto:", erro);
    mostrarMensagem("Erro: " + erro.message, "erro");
  }
}

// ═════════════════════════════════════════════
// SEÇÃO 3: EXIBIÇÃO DOS DADOS
// ═════════════════════════════════════════════

function exibirTabela(produtos) {
  const produtoList = document.getElementById("produtosList");

  let html = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Preço</th>
          <th>Estoque</th>
          <th>Categoria</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
  `;

  produtos.forEach((produto) => {
    html += `
      <tr>
        <td>#${produto.id}</td>
        <td>${produto.nome}</td>
        <td>${formatarPreco(produto.preco)}</td>
        <td>${formatarEstoque(produto.estoque)}</td>
        <td>${produto.categoria}</td>
        <td class="acoes">
          <button class="btn btn-edit"
            onclick="editarProduto(
              ${produto.id},
              '${escaparAspa(produto.nome)}',
              '${escaparAspa(produto.preco)}',
              '${escaparAspa(produto.estoque)}',
              '${escaparAspa(produto.categoria)}'
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
  produtoList.innerHTML = html;
}

function editarProduto(id, nome, preco, estoque, categoria) {
  produtoEmEdicao = id;

  document.getElementById("nome").value = nome;
  document.getElementById("preco").value = preco;
  document.getElementById("estoque").value = estoque;
  document.getElementById("categoria").value = categoria;

  document.querySelector(".form-section h2").textContent =
    `Editando Produto #${id}`;

  document
    .querySelector(".form-section")
    .scrollIntoView({ behavior: "smooth" });
}

async function buscarProdutos(tipo, valor) {
  const loadingMessage = document.getElementById("loadingMessage");
  const emptyMessage = document.getElementById("emptyMessage");
  const produtosList = document.getElementById("produtosList");

  loadingMessage.style.display = "block";
  emptyMessage.style.display = "none";
  produtosList.innerHTML = "";

  try {
    let url = "";
    if (tipo === "nome") {
      url = `http://localhost:3000/produtos/nome/${encodeURIComponent(valor)}`;
    } else {
      url = `http://localhost:3000/produtos/${valor}`;
    }

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error("Erro na busca");

    let produtos = await resposta.json();

    if (!Array.isArray(produtos)) {
      produtos = produtos ? [produtos] : [];
    }

    loadingMessage.style.display = "none";

    if (produtos.length === 0) {
      emptyMessage.style.display = "block";
      emptyMessage.textContent = "Nenhum produto encontrado.";
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

function filtrarProdutos() {
  const valor = document.getElementById("searchInput").value.trim();
  const tipo = document.getElementById("searchType").value;

  if (valor === "") {
    carregarProdutos();
  } else {
    buscarProdutos(tipo, valor);
  }
}

// ═════════════════════════════════════════════
// SEÇÃO 5: EVENT LISTENERS
// ═════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", function () {
  carregarProdutos();

  document
    .getElementById("ProdutoForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const dados = {
        nome: document.getElementById("nome").value.trim(),
        preco: document.getElementById("preco").value.trim(),
        estoque: document.getElementById("estoque").value.trim(),
        categoria: document.getElementById("categoria").value.trim(),
      };

      if (produtoEmEdicao) {
        atualizarProduto(produtoEmEdicao, dados);
      } else {
        criarProduto(dados);
      }
    });

  document
    .getElementById("btnLimpar")
    .addEventListener("click", limparFormulario);

  document
    .getElementById("btnRecarregar")
    .addEventListener("click", carregarProdutos);

  document
    .getElementById("btnBuscar")
    .addEventListener("click", filtrarProdutos);

  document
    .getElementById("searchInput")
    .addEventListener("keyup", function (e) {
      if (e.key === "Enter") filtrarProdutos();
    });

  document
    .getElementById("modalMessage")
    .addEventListener("click", function (e) {
      if (e.target === this) fecharModal();
    });
});
