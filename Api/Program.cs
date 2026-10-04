using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDb>(o => o.UseInMemoryDatabase("tasks"));
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

app.UseCors();

var tasks = app.MapGroup("/api/tasks");

//GET /api/tasks?done=true
tasks.MapGet("/", async (AppDb db, bool?done) =>
{
    var q = db.Tasks.AsQueryable();
    if (done is not null) q = q.Where(t => t.Done == done);
    return await q.OrderBy(t => t.Id).ToListAsync();
});

tasks.MapGet("/{id:int}", async (int id, AppDb db) =>
    await db.Tasks.FindAsync(id) is { } t ? Results.Ok(t) : Results.NotFound());

tasks.MapPost("/", async (TaskDto dto, AppDb db) =>
{
    if (string.IsNullOrWhiteSpace(dto.Title))
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["title"] = ["Título é obrigatório"] 
        });
    var t = new TaskItem { Title = dto.Title.Trim() };
    db.Tasks.Add(t);
    await db.SaveChangesAsync();
    return Results.Created($"/api/tasks/{t.Id}", t);
});

tasks.MapPatch("/{id:int}/toggle", async (int id, AppDb db) =>
{
    var t = await db.Tasks.FindAsync(id);
    if (t is null) return Results.NotFound();
    t.Done = !t.Done;
    await db.SaveChangesAsync();
    return Results.Ok(t);
});

tasks.MapDelete("/{id:int}", async (int id, AppDb db) =>
{
    var t = await db.Tasks.FindAsync(id);
    if (t is null) return Results.NotFound();
    db.Tasks.Remove(t);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();

class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public bool Done { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

record TaskDto(string Title);

class AppDb(DbContextOptions<AppDb> options) : DbContext(options)
{
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
}
