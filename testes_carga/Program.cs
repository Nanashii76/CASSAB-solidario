
using System.Diagnostics;
using System.Text.Json;
using System.Net.Http.Json;

Random rand = new Random();

var baseUrl = "https://cassab-solidario.onrender.com/api/convites";
using var client = new HttpClient();
client.Timeout = TimeSpan.FromMinutes(5);
var codigosGerados = new List<string>();

Console.WriteLine("--- FASE 1: CRIANDO 50 CONVITES ---");

for (int i = 0; i < 500; i++)
{
    var dados = new { 
        usado = false,
        nome = $"User Teste {i}", 
        cpf = rand.Next(100000000, 999999999).ToString() + i.ToString("D2"), 
        placaCarro = $"ABC-{rand.Next(100, 9999)}",
        telefone = "6199999999",
        instagram = "@cassab",
        acompanhantes = new List<object>() 
    };
    
    var response = await client.PostAsJsonAsync($"{baseUrl}/criar", dados);
    
    if (!response.IsSuccessStatusCode) {
        var erroBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine("ERRO NO JAVA: " + erroBody);
        return; 
    }
    
    var jsonString = await response.Content.ReadAsStringAsync();
    using var doc = JsonDocument.Parse(jsonString);
    
    // O 'codigo' é o identificador único (Chave Primária) do convite
    var codigo = doc.RootElement.GetProperty("codigo").GetString();

    if (!string.IsNullOrEmpty(codigo)) 
    {
        codigosGerados.Add(codigo);
        Console.WriteLine("Sucesso ao criar ID: " + codigo);
        // Adicione isso logo após o codigosGerados.Add(codigo);
        Console.WriteLine($"Progresso: {i + 1}/50 - ID: {codigo}");
    }
}

Console.WriteLine("--- FASE 2: DISPARANDO CHECK-IN (CARGA) ---");
var stopwatch = Stopwatch.StartNew();

// Usamos o código (Chave Primária) para vincular cada check-in ao registro certo
var tarefas = codigosGerados.Select(codigo => client.PostAsync($"{baseUrl}/checkin/{codigo}", null));
var resultados = await Task.WhenAll(tarefas);

stopwatch.Stop();

var sucessos = resultados.Count(r => r.IsSuccessStatusCode);
Console.WriteLine("Resultado: " + sucessos + "/50 check-ins realizados.");
Console.WriteLine("Tempo total da carga: " + stopwatch.ElapsedMilliseconds + "ms");