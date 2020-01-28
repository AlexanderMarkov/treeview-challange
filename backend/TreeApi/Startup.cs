using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TreeApi.Models;
using Microsoft.EntityFrameworkCore;
using TreeApi.Services;
using TreeApi.Extensions;

namespace TreeApi
{
	public class Startup
	{
		public Startup(IConfiguration configuration)
		{
			Configuration = configuration;
		}

		public IConfiguration Configuration { get; }

		public void ConfigureServices(IServiceCollection services)
		{
			services.AddControllers();
			services.AddCors();

			services.AddDbContext<TreeDbContext>(options =>
			{
				options.UseInMemoryDatabase("TreeInMemoryDatabase");
			});

			services.AddScoped<ITreeDbContextProvider, TreeDbContextProvider>();
			services.AddScoped<ITreeManager, TreeManager>();
		}

		public void Configure(IApplicationBuilder app)
		{
			app.UseCors(builder =>
				builder
					.WithOrigins("http://localhost:4200")
					.AllowAnyMethod()
					.AllowAnyHeader()
			);
			app.UseRouting();
			app.UseEndpoints(endpoints =>
			{
				endpoints.MapControllers();
			});

			InitializeAsync(app.ApplicationServices).GetAwaiter().GetResult();
		}

		public async Task InitializeAsync(IServiceProvider applicationServices)
		{
			using var scope = applicationServices.CreateScope();
			var serviceProvider = scope.ServiceProvider;

			using var context = serviceProvider.GetRequiredService<TreeDbContext>();
			await context.ResetAsync();
		}
	}
}
