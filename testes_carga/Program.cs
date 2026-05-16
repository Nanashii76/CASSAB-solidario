
using System.Diagnostics;
using System.Text.Json;
using System.Net.Http.Json;

var baseUrl = Environment.GetEnvironmentVariable("CASSAB_API_BASE")?.TrimEnd('/')
    ?? "http://localhost:8080/api/convites";
var runCheckin = string.Equals(
    Environment.GetEnvironmentVariable("CASSAB_RUN_CHECKIN"),
    "1",
    StringComparison.OrdinalIgnoreCase);

if (!int.TryParse(Environment.GetEnvironmentVariable("CASSAB_CREATE_COUNT"), out var total) || total < 1)
    total = 10;

if (!int.TryParse(Environment.GetEnvironmentVariable("CASSAB_ACOMPANHANTES_COUNT"), out var acompPorConvite) || acompPorConvite < 0)
    acompPorConvite = 15;

using var client = new HttpClient();
client.Timeout = TimeSpan.FromMinutes(5);
var codigosGerados = new List<string>();

var rnd = Random.Shared;
var cpfsUsados = new HashSet<string>();

// CPF aleatório com dígitos verificadores válidos; único entre titulares e acompanhantes
string NovoCpfAleatorio()
{
    Span<int> n = stackalloc int[9];
    Span<char> ch = stackalloc char[11];
    while (true)
    {
        for (var j = 0; j < 9; j++) n[j] = rnd.Next(0, 10);

        var soma = 0;
        for (var j = 0; j < 9; j++) soma += n[j] * (10 - j);
        var resto = soma % 11;
        var d1 = resto < 2 ? 0 : 11 - resto;

        soma = 0;
        for (var j = 0; j < 9; j++) soma += n[j] * (11 - j);
        soma += d1 * 2;
        resto = soma % 11;
        var d2 = resto < 2 ? 0 : 11 - resto;

        for (var j = 0; j < 9; j++) ch[j] = (char)('0' + n[j]);
        ch[9] = (char)('0' + d1);
        ch[10] = (char)('0' + d2);
        var digits = new string(ch);

        if (cpfsUsados.Add(digits))
            return digits;
    }
}

Console.WriteLine($"--- Criando {total} convite(s) com {acompPorConvite} acompanhante(s) cada em {baseUrl} ---");
Console.WriteLine("--- CPFs: aleatórios (válidos) e únicos no lote ---");

for (int i = 0; i < total; i++)
{
    var cpfTitular = NovoCpfAleatorio();
    var acompanhantes = new List<object>();
    for (int a = 0; a < acompPorConvite; a++)
    {
        acompanhantes.Add(new
        {
            nome = $"Acomp {(i + 1):D2}",
            sobrenome = $"Pessoa {a + 1:D2}",
            cpf = NovoCpfAleatorio()
        });
    }

    var dados = new
    {
        nome = $"User Teste Carga {i + 1}",
        cpf = cpfTitular,
        placaCarro = $"TST-{1000 + i:D4}",
        telefone = $"6199999{i % 1000:D4}",
        instagram = "@cassab_carga",
        acompanhantes
    };

    HttpResponseMessage response;
    try
    {
        response = await client.PostAsJsonAsync($"{baseUrl}/criar", dados);
    }
    catch (HttpRequestException ex)
    {
        Console.WriteLine($"Sem conexão com a API ({baseUrl}). Suba o Spring Boot e o PostgreSQL, depois tente de novo.");
        Console.WriteLine($"Detalhe: {ex.Message}");
        Environment.ExitCode = 1;
        return;
    }

    if (!response.IsSuccessStatusCode)
    {
        var erroBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"ERRO ({response.StatusCode}): {erroBody}");
        Environment.ExitCode = 1;
        return;
    }

    var jsonString = await response.Content.ReadAsStringAsync();
    using var doc = JsonDocument.Parse(jsonString);
    var codigo = doc.RootElement.GetProperty("codigo").GetString();
    var nAcomp = doc.RootElement.TryGetProperty("acompanhantes", out var el) && el.ValueKind == JsonValueKind.Array
        ? el.GetArrayLength()
        : 0;

    if (!string.IsNullOrEmpty(codigo))
    {
        codigosGerados.Add(codigo);
        Console.WriteLine($"[{i + 1}/{total}] OK codigo={codigo} acompanhantes={nAcomp}");
    }
}

Console.WriteLine($"Concluído: {codigosGerados.Count} convite(s) criado(s).");

if (!runCheckin || codigosGerados.Count == 0)
    return;

Console.WriteLine("--- Check-in em lote (CASSAB_RUN_CHECKIN=1) ---");
var stopwatch = Stopwatch.StartNew();
var tarefas = codigosGerados.Select(codigo => client.PostAsync($"{baseUrl}/checkin/{codigo}", null));
var resultados = await Task.WhenAll(tarefas);
stopwatch.Stop();

var sucessos = resultados.Count(r => r.IsSuccessStatusCode);
Console.WriteLine($"Check-ins OK: {sucessos}/{codigosGerados.Count} em {stopwatch.ElapsedMilliseconds} ms");
